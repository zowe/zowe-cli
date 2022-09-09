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

import * as fs from "fs";
import * as nodeJsPath from "path";
import * as tar from "tar";
import { spawnSync, StdioOptions } from "child_process";

import {
    CliUtils, ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError,
    IO, ISystemInfo, ProcessUtils
} from "@zowe/imperative";

import { IDaemonEnableQuestions } from "../doc/IDaemonEnableQuestions";

/**
 * Handler to enable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class EnableDaemonHandler implements ICommandHandler {
    private static openNewTerminalMsg = "To run further Zowe commands, close this terminal and open a new terminal.";

    /**
     * Process the enable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(cmdParams: IHandlerParameters): Promise<void> {
        let userMsg: string;
        try {
            const userQuestions: IDaemonEnableQuestions = {
                /* TODO: Use this code block when we are ready to automatically add zowe/bin to the PATH
                canAskUser: true,
                addBinToPathVal: "y"
                */
                canAskUser: false,
                addBinToPathVal: "n"
            };
            userMsg = await this.enableDaemon(userQuestions);
        } catch(impErr) {
            cmdParams.response.console.log("Failed to enable Zowe CLI daemon mode.\n" + (impErr as ImperativeError).message);
            cmdParams.response.data.setExitCode(1);
            return;
        }

        cmdParams.response.console.log("Zowe CLI daemon mode is enabled.\n" + userMsg);
        cmdParams.response.data.setExitCode(0);
    }

    /**
     * Enable daemon mode. We extract our native executable and place it
     * in ZOWE_CLI_HOME/bin.
     *
     * @throws {ImperativeError}
     *
     * @param {boolean} canAskQuestions Can we interactively ask the user questions?
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private async enableDaemon(userQuestions: IDaemonEnableQuestions): Promise<string> {
        // determine our current OS
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        // form the path to our prebuilds tar file
        let preBldTgz = __dirname + "../../../../prebuilds/zowe-";
        let exeFileName = "zowe";
        switch (sysInfo.platform) {
            case "darwin": {
                preBldTgz += "macos.tgz";
                break;
            }
            case "linux": {
                preBldTgz += "linux.tgz";
                break;
            }
            case "win32": {
                preBldTgz += "windows.tgz";
                exeFileName += ".exe";
                break;
            }
            default: {
                throw new ImperativeError({
                    msg: `Daemon mode is not supported on the '${sysInfo.platform}' operating system.`
                });
            }
        }

        preBldTgz = nodeJsPath.normalize(preBldTgz);
        if (!IO.existsSync(preBldTgz)) {
            throw new ImperativeError({
                msg: `The archive for your OS executable does not exist: ${preBldTgz}`
            });
        }

        // form the path to the bin directory in ZOWE_CLI_HOME
        const pathToZoweBin = nodeJsPath.normalize(ImperativeConfig.instance.cliHome + "/bin");

        // Does the ZOWE_CLI_HOME bin directory exist?
        if (IO.existsSync(pathToZoweBin)) {
            if (!IO.isDir(pathToZoweBin)) {
                throw new ImperativeError({
                    msg: `The existing file '${pathToZoweBin}' must be a directory.`
                });
            }
        } else {
            // create the directory
            try {
                IO.createDirSync(pathToZoweBin);
            }
            catch(err) {
                throw new ImperativeError({
                    msg: `Unable to create directory '${pathToZoweBin}'.\nReason: ${err}`
                });
            }
        }

        // extract executable from the tar file into the bin directory
        await this.unzipTgz(preBldTgz, pathToZoweBin, ImperativeConfig.instance.rootCommandName);

        /* Even though we await the unzip above, the OS still considers the exe file in-use
         * for a while. We will get the following error message when trying to run the exe.
         * "The process cannot access the file because it is being used by another process."
         * So, we wait a little bit.
         */
        const halfSecOfMillis = 500;
        await CliUtils.sleep(halfSecOfMillis);

        // display the version of the executable
        let userInfoMsg: string = "Zowe CLI native executable version = ";
        const zoweExePath = nodeJsPath.resolve(pathToZoweBin, exeFileName);
        const ioOpts: StdioOptions = ["pipe", "pipe", "pipe"];
        try {
            const spawnResult = spawnSync(zoweExePath, ["--version-exe"], {
                stdio: ioOpts,
                shell: false
            });
            if (spawnResult.stdout) {
                // remove any newlines from the version number
                userInfoMsg += spawnResult.stdout.toString().replace(/\r?\n|\r/g, "");
            } else {
                userInfoMsg += "Failed to get version number\n";
                if (spawnResult.stderr) {
                    userInfoMsg += spawnResult.stderr.toString();
                }
            }
        } catch (err) {
            userInfoMsg += err.message;
        }

        // add our bin directory to the PATH if is it is not already there
        userInfoMsg += await this.addZoweBinToPath(pathToZoweBin, userQuestions);

        // if ZOWE_USE_DAEMON is set, and turned off, add a warning message
        if (process.env?.ZOWE_USE_DAEMON?.length > 0) {
            switch (process.env.ZOWE_USE_DAEMON) {
                case "no":
                case "false":
                case "0": {
                    userInfoMsg += `\n\nYour ZOWE_USE_DAEMON environment variable is set to '${process.env.ZOWE_USE_DAEMON}'.` +
                    "\nYou must remove it, or set it to 'yes' to use daemon mode.";
                }
            }
        }

        return userInfoMsg;
    }

    /**
     * Unzip, from a gzipped tar file, any file that contains fileToExtract as a
     * substring of the file name. The file will be placed into toDir.
     * We expect toDir to already exist.
     *
     * @param tgzFile The gzipped tar file that we will extract
     *
     * @param toDir The directory into which we extract files
     *
     * @param fileToExtract The file name (or substring of the file name) to extract.
     *
     * @throws {ImperativeError}
     * @returns A void promise to synchronize this operation.
     */
    private async unzipTgz(tgzFile: string, toDir: string, fileToExtract: string): Promise<void> {
        return new Promise<void>((resolve) => {
            fs.createReadStream(tgzFile)
                .on('error', function(err: any) {
                    throw new ImperativeError({
                        msg: err
                    });
                })
                .pipe(new tar.Parse())
                .on('entry', function(entry: any) {
                    if (entry.type == "File" && (entry.path as string).includes(fileToExtract)) {
                        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();
                        let fileCreateOpts: any = {};
                        if (sysInfo.platform == "linux" || sysInfo.platform == "darwin") {
                            // set file permissions to read, write and execute for user, read and execute for group, in octal
                            fileCreateOpts = { mode: 0o750 };
                        }
                        // do not include any path structure from the tgz, just the exe name
                        entry.pipe(fs.createWriteStream(nodeJsPath.resolve(toDir, nodeJsPath.basename(entry.path)), fileCreateOpts));
                    }
                })
                .on("end", () => {
                    resolve();
                });
        });
    }

    /**
     * Add our .zowe/bin directory to the user's PATH.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @param {IDaemonEnableQuestions} userQuestions Questions for user (if permitted)
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private async addZoweBinToPath(pathToZoweBin: string, userQuestions: IDaemonEnableQuestions): Promise<string> {
        let userInfoMsg: string = "";
        const osPlatform: string = ProcessUtils.getBasicSystemInfo().platform;

        if (process.env.PATH?.includes(pathToZoweBin)) {
            // bash & zsh command-path caching forces us to require a new terminal
            if ( osPlatform !== "win32") {
                userInfoMsg += "\n\n" + EnableDaemonHandler.openNewTerminalMsg;
            }
        } else {
            // ZOWE_CLI_HOME/bin is not on our PATH, we want to add it
            let answer: string = null;
            if (userQuestions.canAskUser) {
                // alter PATH question by OS
                let pathQuestion = "May we add the Zowe bin directory to your\nPATH in your ";
                if ( osPlatform === "win32") {
                    pathQuestion += "permanent user environment";
                } else {
                    pathQuestion += ".profile file";
                }
                pathQuestion += " [y or n] ? ";
                // ask user for permission to update PATH
                answer = await CliUtils.readPrompt(pathQuestion);
            } else {
                // don't ask, just use default
                answer = userQuestions.addBinToPathVal;
            }

            if (answer !== null && answer === "y" || answer === "Y") {
                // user wants us to do it for him/her
                if ( osPlatform === "win32") {
                    userInfoMsg += await this.addZoweBinOnWindows(pathToZoweBin);
                } else {
                    userInfoMsg += this.addZoweBinOnPosix(pathToZoweBin);
                }
            } else {
                userInfoMsg += `\n\nManually add '${pathToZoweBin}' to your PATH.` +
                    "\nOtherwise, you will continue to run the classic Zowe CLI interpreter.";
            }

            // when zowe/bin not already on path, user needs a new terminal
            userInfoMsg += "\n\n" + EnableDaemonHandler.openNewTerminalMsg;
        } // end zowe/bin not in path

        return userInfoMsg;
    }

    /**
     * Add our .zowe/bin directory to the front of the user's PATH on Windows.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private async addZoweBinOnWindows(pathToZoweBin: string): Promise<string> {
        let userInfoMsg: string = "";
        try {
            /* TODO:
             * - Detect if zowe/bin is in system or user PATH env variable
             *      - For user PATH :  reg query "HKCU\Environment"
             *      - For system PATH: reg query "???"
             * - Add zowe/bin to the front of either user or system PATH
             * - confirm that we do not exceed max path (1024 for user)
             * - For system PATH
             *      - get user name
             *      - prompt for password
             * - Use setx to set the new PATH value
             */

            const ioOptions: StdioOptions = ["pipe", "pipe", "pipe"];
            const spawnResult = spawnSync("setx",
                ["zowe_set_env_test", pathToZoweBin + ";" + process.env.PATH],
                {
                    stdio: ioOptions,
                    shell: false
                }
            );
            if (spawnResult.stdout) {
                userInfoMsg += spawnResult.stdout.toString();
            }
            if (spawnResult.stderr) {
                userInfoMsg += spawnResult.stderr.toString();
            }
        } catch (err) {
            userInfoMsg += "Failed to run setx. Reason = " + err.message;
        }

        return userInfoMsg;
    }

    /**
     * Add our .zowe/bin directory to the front of the user's PATH on Linux and MAC.
     * Do that by adding a line at the end of the user's .profile file.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private addZoweBinOnPosix(pathToZoweBin: string): string {
        // Todo: Implement addZoweBinOnPosix
        const userInfoMsg: string = "";
        return userInfoMsg;
    }
}
