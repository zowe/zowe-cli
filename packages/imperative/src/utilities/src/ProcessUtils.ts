/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { SpawnSyncOptions } from "child_process";
import { ExecUtils } from "./ExecUtils";
import { Logger } from "../../logger";
import { ImperativeConfig } from "./ImperativeConfig";
import { ISystemInfo } from "./doc/ISystemInfo";
import * as spawn from "cross-spawn";

/**
 * This enum represents the possible results from isGuiAvailable.
 */
export enum GuiResult {
    /** A GUI is available */
    GUI_AVAILABLE = 0,

    /** No GUI because this is an SSH connection. */
    NO_GUI_SSH = 1,

    /** No GUI because The $DISPLAY environment variable is not set. */
    NO_GUI_NO_DISPLAY = 2
}

/**
 * A collection of utilities related to the running process.
 * @export
 * @class ProcessUtils
 */
export class ProcessUtils {
    // __________________________________________________________________________
    /**
     * Process utility to wrap callback process routines into promises
     * Turn nextTick into a promise to prevent nesting
     * @static
     * @param {() => void} callback - called before promise is resolved
     * @param {...any[]} args - arguments passed to the callback
     * @returns {Promise<void>} - fulfilled whenever callback is invoked
     * @memberof ProcessUtils
     */
    public static nextTick(callback: (...args: any[]) => void, ...args: any[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            process.nextTick(() => {
                callback(...args);
                resolve();
            });
        });
    }

    // __________________________________________________________________________
    /**
     * Is a Graphical User Interface available in the environment in which
     * the current command is running?
     *
     * @returns {boolean} - True if GUI. False when no GUI.
     */
    public static isGuiAvailable(): GuiResult {
        /* If any of the SSH environment variables are defined,
         * then we are in an ssh session --> no GUI.
         */
        if (typeof process.env.SSH_CONNECTION !== "undefined" ||
            typeof process.env.SSH_CLIENT !== "undefined" ||
            typeof process.env.SSH_TTY !== "undefined")
        {
            return GuiResult.NO_GUI_SSH;
        }

        /* On linux the DISPLAY environment variable indicates
         * that we are in an X-Window environment.
         */
        if (process.platform !== "win32" && process.platform !== "darwin") {
            if (typeof process.env.DISPLAY === "undefined" ||
                process.env.DISPLAY === "")
            {
                return GuiResult.NO_GUI_NO_DISPLAY;
            }
        }

        // otherwise we assume we have a GUI
        return GuiResult.GUI_AVAILABLE;
    }

    /**
     * Get some basic information about the system
     */
    public static getBasicSystemInfo(): ISystemInfo {
        const sysInfo: ISystemInfo = {arch: undefined, platform: undefined};
        sysInfo.arch = process.arch;
        sysInfo.platform = process.platform;
        return sysInfo;
    }

    /**
     * Open a file or URL in the default application associated with its file
     * extension or URL protocol. This method is only supported in graphical
     * environments.
     * @param pathOrUrl File path or Internet URL to open
     */
    public static openInDefaultApp(pathOrUrl: string) {
        const openerProc = require("opener")(pathOrUrl);

        if (process.platform !== "win32") {
            /* On linux, without the following statements, the zowe
            * command does not return until the browser is closed.
            * Mac is untested, but for now we treat it like linux.
            */
            openerProc.unref();
            openerProc.stdin.unref();
            openerProc.stdout.unref();
            openerProc.stderr.unref();
        }
    }

    /**
     * Open a file in the best editor that can be found in the current
     * environment. In a graphical environment, the default application
     * associated with its file extension will be launched. In a command-line
     * environment, the file will be opened in vi, or the editor in the
     * the `{envVariablePrefix}_EDITOR` environment variable if specified.
     * @param filePath - File path to edit
     * @param editorOpt - Chosen editor, can be a path or a valid environment variable name
     * @param sync - Boolean where true == synchronous and false == asynchronous
     */
    public static openInEditor(filePath: string, editorOpt?: string, sync?: boolean) {
        let editor = editorOpt;
        if (!editorOpt && ImperativeConfig.instance.loadedConfig.envVariablePrefix != null) {
            const editorEnvVar = `${ImperativeConfig.instance.loadedConfig.envVariablePrefix}_EDITOR`;
            if (process.env[editorEnvVar] != null) { editor = process.env[editorEnvVar]; }
        }
        if (ProcessUtils.isGuiAvailable() === GuiResult.GUI_AVAILABLE) {
            Logger.getImperativeLogger().info(`Opening ${filePath} in graphical editor`);
            if (editor != null) {
                (sync ? spawn.sync : spawn.spawn)(editor, [filePath], { stdio: "inherit" });
            }
            else { this.openInDefaultApp(filePath); }

        } else {
            if (editor == null) { editor = "vi"; }
            Logger.getImperativeLogger().info(`Opening ${filePath} in command-line editor ${editor}`);
            (sync ? spawn.sync : spawn.spawn)(editor, [filePath], { stdio: "inherit" });
        }
    }

    /**
     * Spawn a process with arguments and throw an error if the process fails.
     * Parameters are same as `child_process.spawnSync` (see Node.js docs).
     * Use this method if you want the safe argument parsing of `spawnSync`
     * combined with the smart output handling of `execSync`.
     * @deprecated Use ExecUtils.spawnAndGetOutput instead.
     * @returns Contents of stdout as buffer or string
     */
    public static execAndCheckOutput(command: string, args?: string[], options?: SpawnSyncOptions): Buffer | string {
        return ExecUtils.spawnAndGetOutput(command, args, options);
    }
}