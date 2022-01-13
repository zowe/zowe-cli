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

import * as nodeJsPath from "path";
import { spawnSync, StdioOptions } from "child_process";

import {
    ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError,
    IO, ISystemInfo, ProcessUtils
} from "@zowe/imperative";

/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class DisableDaemonHandler implements ICommandHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(cmdParams: IHandlerParameters): Promise<void> {
        try {
            await this.disableDaemon();
        } catch(impErr) {
            cmdParams.response.console.log("Failed to disable Zowe CLI daemon mode.\n" + (impErr as ImperativeError).message);
            cmdParams.response.data.setExitCode(1);
            return;
        }

        cmdParams.response.console.log("Zowe CLI daemon mode is disabled.");
        if (ProcessUtils.getBasicSystemInfo().platform != "win32") {
            cmdParams.response.console.log("To run further Zowe commands, close this terminal and open a new terminal.");
        }

        cmdParams.response.data.setExitCode(0);
    }

    /**
     * Disable daemon mode.
     *
     * @throws {ImperativeError}
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
          */
    private async disableDaemon(): Promise<void> {
        // form the path to the bin directory in ZOWE_CLI_HOME
        let zoweExePath = nodeJsPath.normalize(ImperativeConfig.instance.cliHome + "/bin/");

        // determine our current OS
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        // add the right EXE file name for the current OS
        switch (sysInfo.platform) {
            case "darwin":
            case "linux": {
                zoweExePath += "zowe";
                break;
            }
            case "win32": {
                zoweExePath += "zowe.exe";
                break;
            }
            default: {
                throw new ImperativeError({
                    msg: `Daemon mode is not supported on the '${sysInfo.platform}' operating system.`
                });
            }
        }

        // remove the EXE if it exists
        if (IO.existsSync(zoweExePath)) {
            IO.deleteFile(zoweExePath);
        }

        // find processes running "node"
        let procArray;
        try {
            const findProc = require('find-process');
            procArray = await findProc('name', 'node', true);
        } catch(err) {
            /* This catch is not invoked, because the find-process.finders[].win32.utils.spawn function
             * does not add an on("error") event handler for the child_process.spawn() function it calls.
             * Thus, ENOENT is emitted as an uncatchable event. Thanks find-process!
             * If a user gets an error like this, just tell him that powershell is not on his PATH.
             * Typically it should be. The same type of error might occur on Linux if 'ps' were not
             * on the user's PATH.
             */
            let powerShellHint = "";
            if (err.includes("powershell.exe ENOENT")) {
                powerShellHint = "\nPowershell.exe may not be on your PATH.";
            }
            throw new ImperativeError({
                msg: "Failed while searching for the Zowe CLI daemon process.\n"
                     + `Reason: ${err}`
                     + powerShellHint
            });
        }

        /* Paths in proc list on Windows sometimes have forward slash and
         * sometimes backslash, so allow either. This RegEx is designed to
         * match patterns like these:
         *
         * node /home/someUser/.nvm/versions/node/v17.1.0/bin/zowe --daemon
         * node /home/someUser/GitHub/zowe-cli-next/packages/cli/lib/main.js --daemon
         * "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\@zowe\cli\lib\main.js" --daemon
         */
        const zoweCmdRegEx = "zowe.*[/|\\\\]cli[/|\\\\]lib[/|\\\\]main.js.* --daemon" + "|" +
                             "[/|\\\\]bin[/|\\\\]zowe.* --daemon";

        // match and kill any running Zowe daemon
        for (const nextProc of procArray) {
            if (nextProc.cmd.match(zoweCmdRegEx)) {
                process.kill(nextProc.pid, "SIGINT");
            }
        }
    }
}
