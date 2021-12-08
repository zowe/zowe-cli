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
// todo: import * as tar from "tar";
import * as zlib from "zlib";

import {
    ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError,
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
    public process(cmdParams: IHandlerParameters): Promise<void> {
        let userMsg: string;
        try {
            userMsg = this.enableDaemon();
        } catch(impErr) {
            cmdParams.response.console.log("Failed to enable daemon mode.\n" + (impErr as ImperativeError).message);
            cmdParams.response.data.setExitCode(1);
            return;
        }

        cmdParams.response.console.log("Daemon mode enabled.\n" + userMsg);
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
    private enableDaemon(): string {
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

        // todo: check the version of any existing executable

        // extract executable from the tar file into the bin directory
        this.unzipTgz(preBldTgz, zoweHomeBin, "todo");

        // detect whether ZOWE_CLI_HOME/bin is already on our PATH

        // start the daemon if it is already on our PATH

        // Check if ZOWE_USE_DAEMON has a value

        // display results and directions to the user

        return `You must add '${zoweHomeBin}' to your path.`;
    }

    /**
     * Unzip some or all of the content of a gzipped tar file.
     * in ZOWE_CLI_HOME/bin.
     *
     * @param tgzFile The gzipped tar file that we will extract
     *
     * @param toDir The directory into whic we extract files
     *
     * @param extractRegex The Regex to match files to extract.
     *
     * @throws {ImperativeError}
     */
    private unzipTgz(tgzFile: string, toDir: string, extractRegex: string): void {
        console.log("Todo: unzipTgz:\n   tgzFile = " + tgzFile +
            "\n   toDir = " + toDir +
            "\n   extractRegex = " + extractRegex
        );

        /* todo:
        fs.createReadStream(tgzFile)
            .on('error', function(err) {
                throw new ImperativeError({
                    msg: err
                });
            })
            .pipe(zlib.Unzip())
            .pipe(tar.Parse())
        todo */
    }
}
