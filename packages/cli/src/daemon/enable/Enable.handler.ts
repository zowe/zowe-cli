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
import { execSync, StdioOptions } from "child_process";

import {
    CliUtils, ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError,
    IO, ISystemInfo, ProcessUtils
} from "@zowe/imperative";

/**
 * Handler to enable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class EnableDaemonHandler implements ICommandHandler {
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
            userMsg = await this.enableDaemon();
        } catch(impErr) {
            cmdParams.response.console.log("Failed to enable Zowe CLI daemon mode.\n" + (impErr as ImperativeError).message);
            cmdParams.response.data.setExitCode(1);
            return;
        }

        cmdParams.response.console.log("Zowe CLI daemon mode enabled.\n" + userMsg);
        cmdParams.response.data.setExitCode(0);
        return;
    }

    /**
     * Enable daemon mode. We extract our native executable and place it
     * in ZOWE_CLI_HOME/bin.
     *
     * @throws {ImperativeError}
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private async enableDaemon(): Promise<string> {
        // determine our current OS
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        // form the path to our prebuilds tar file
        let preBldTgz = __dirname + "../../../../prebuilds/zowe-";
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
                break;
            }
            default: {
                throw new ImperativeError({
                    msg: `Daemon mode is not supported on the '${sysInfo.platform}' operating system.`
                });
            }
        }

        preBldTgz = nodeJsPath.normalize(preBldTgz);
        if (IO.existsSync(preBldTgz) == false) {
            throw new ImperativeError({
                msg: `The zip file for your OS executable does not exist: ${preBldTgz}`
            });
        }

        // form the path to the bin directory in ZOWE_CLI_HOME
        const zoweHomeBin = nodeJsPath.normalize(ImperativeConfig.instance.cliHome + "/bin");

        // Does the ZOWE_CLI_HOME bin directory exist?
        if (IO.existsSync(zoweHomeBin)) {
            if (IO.isDir(zoweHomeBin) == false) {
                throw new ImperativeError({
                    msg: `The existing file '${zoweHomeBin}' must be a directory.`
                });
            }
        } else {
            // create the directory
            try {
                IO.createDirSync(zoweHomeBin);
            }
            catch(err) {
                throw new ImperativeError({
                    msg: `Unable to create directory '${zoweHomeBin}'.\nReason: ${err}`
                });
            }
        }

        // extract executable from the tar file into the bin directory
        await this.unzipTgz(preBldTgz, zoweHomeBin, ImperativeConfig.instance.rootCommandName);

        /* Even though we await the unzip above, the OS still considers the exe file in-use
         * for a while. We will get the following error message when trying to run the exe.
         * "The process cannot access the file because it is being used by another process."
         * So, we wait a little bit.
         */
        const halfSecOfMillis = 500;
        await CliUtils.sleep(halfSecOfMillis);

        // display the version of the executable
        let userInfoMsg: string = "Zowe CLI native executable version = ";
        const zoweExePath = nodeJsPath.resolve(zoweHomeBin, "zowe");
        const pipe: StdioOptions = ["pipe", "pipe", process.stderr];
        try {
            const execOutput = execSync(`"${zoweExePath}" --version-exe`, {
                stdio: pipe
            });
            // remove any newlines from the version number
            userInfoMsg += execOutput.toString().replace(/\r?\n|\r/g, "");
        } catch (err) {
            userInfoMsg += err.message;
        }

        // if ZOWE_CLI_HOME/bin is not on our PATH, add an instruction to add it
        if (process.env?.PATH?.length > 0) {
            if (!process.env.PATH.includes(zoweHomeBin)) {
                userInfoMsg += `\n\nAdd '${zoweHomeBin}' to your path.` +
                    "\nOtherwise, you will continue to run the classic Zowe CLI interpreter.";
            }
        }

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
                .on('error', function(err) {
                    throw new ImperativeError({
                        msg: err
                    });
                })
                .pipe(new tar.Parse())
                .on('entry', function(entry: any) {
                    if (entry.type == "File" && (entry.path as string).includes(fileToExtract)) {
                        // do not include any path structure from the tgz, just the exe name
                        entry.pipe(fs.createWriteStream(nodeJsPath.resolve(toDir, nodeJsPath.basename(entry.path))));
                    }
                })
                .on("end", () => {
                    resolve();
                });
        });
    }
}
