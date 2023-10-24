"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const nodeJsPath = require("path");
const tar = require("tar");
const child_process_1 = require("child_process");
const imperative_1 = require("@zowe/imperative");
/**
 * Handler to enable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class EnableDaemonHandler {
    /**
     * Process the enable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    process(cmdParams) {
        return __awaiter(this, void 0, void 0, function* () {
            let userMsg;
            try {
                const userQuestions = {
                    /* TODO: Use this code block when we are ready to automatically add zowe/bin to the PATH
                    canAskUser: true,
                    addBinToPathVal: "y"
                    */
                    canAskUser: false,
                    addBinToPathVal: "n"
                };
                userMsg = yield this.enableDaemon(userQuestions);
            }
            catch (impErr) {
                cmdParams.response.console.log("Failed to enable Zowe CLI daemon mode.\n" + impErr.message);
                cmdParams.response.data.setExitCode(1);
                return;
            }
            cmdParams.response.console.log("Zowe CLI daemon mode is enabled.\n" + userMsg);
            cmdParams.response.data.setExitCode(0);
        });
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
    enableDaemon(userQuestions) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // determine our current OS
            const sysInfo = imperative_1.ProcessUtils.getBasicSystemInfo();
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
                    throw new imperative_1.ImperativeError({
                        msg: `Daemon mode is not supported on the '${sysInfo.platform}' operating system.`
                    });
                }
            }
            preBldTgz = nodeJsPath.normalize(preBldTgz);
            if (!imperative_1.IO.existsSync(preBldTgz)) {
                throw new imperative_1.ImperativeError({
                    msg: `The archive for your OS executable does not exist: ${preBldTgz}`
                });
            }
            // form the path to the bin directory in ZOWE_CLI_HOME
            const pathToZoweBin = nodeJsPath.normalize(imperative_1.ImperativeConfig.instance.cliHome + "/bin");
            // Does the ZOWE_CLI_HOME bin directory exist?
            if (imperative_1.IO.existsSync(pathToZoweBin)) {
                if (!imperative_1.IO.isDir(pathToZoweBin)) {
                    throw new imperative_1.ImperativeError({
                        msg: `The existing file '${pathToZoweBin}' must be a directory.`
                    });
                }
            }
            else {
                // create the directory
                try {
                    imperative_1.IO.createDirSync(pathToZoweBin);
                }
                catch (err) {
                    throw new imperative_1.ImperativeError({
                        msg: `Unable to create directory '${pathToZoweBin}'.\nReason: ${err}`
                    });
                }
            }
            // extract executable from the tar file into the bin directory
            yield this.unzipTgz(preBldTgz, pathToZoweBin, imperative_1.ImperativeConfig.instance.rootCommandName);
            /* Even though we await the unzip above, the OS still considers the exe file in-use
             * for a while. We will get the following error message when trying to run the exe.
             * "The process cannot access the file because it is being used by another process."
             * So, we wait a little bit.
             */
            const halfSecOfMillis = 500;
            yield imperative_1.CliUtils.sleep(halfSecOfMillis);
            // display the version of the executable
            let userInfoMsg = "Zowe CLI native executable version = ";
            const zoweExePath = nodeJsPath.resolve(pathToZoweBin, exeFileName);
            const ioOpts = ["pipe", "pipe", "pipe"];
            try {
                const spawnResult = (0, child_process_1.spawnSync)(zoweExePath, ["--version-exe"], {
                    stdio: ioOpts,
                    shell: false
                });
                if (spawnResult.stdout) {
                    // remove any newlines from the version number
                    userInfoMsg += spawnResult.stdout.toString().replace(/\r?\n|\r/g, "");
                }
                else {
                    userInfoMsg += "Failed to get version number\n";
                    if (spawnResult.stderr) {
                        userInfoMsg += spawnResult.stderr.toString();
                    }
                }
            }
            catch (err) {
                userInfoMsg += err.message;
            }
            // add our bin directory to the PATH if is it is not already there
            userInfoMsg += yield this.addZoweBinToPath(pathToZoweBin, userQuestions);
            // if ZOWE_USE_DAEMON is set, and turned off, add a warning message
            if (((_b = (_a = process.env) === null || _a === void 0 ? void 0 : _a.ZOWE_USE_DAEMON) === null || _b === void 0 ? void 0 : _b.length) > 0) {
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
        });
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
    unzipTgz(tgzFile, toDir, fileToExtract) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                fs.createReadStream(tgzFile)
                    .on('error', function (err) {
                    throw new imperative_1.ImperativeError({
                        msg: err
                    });
                })
                    .pipe(new tar.Parse())
                    .on('entry', function (entry) {
                    if (entry.type == "File" && entry.path.includes(fileToExtract)) {
                        const sysInfo = imperative_1.ProcessUtils.getBasicSystemInfo();
                        let fileCreateOpts = {};
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
    addZoweBinToPath(pathToZoweBin, userQuestions) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let userInfoMsg = "";
            const osPlatform = imperative_1.ProcessUtils.getBasicSystemInfo().platform;
            if ((_a = process.env.PATH) === null || _a === void 0 ? void 0 : _a.includes(pathToZoweBin)) {
                // bash & zsh command-path caching forces us to require a new terminal
                if (osPlatform !== "win32") {
                    userInfoMsg += "\n\n" + EnableDaemonHandler.openNewTerminalMsg;
                }
            }
            else {
                // ZOWE_CLI_HOME/bin is not on our PATH, we want to add it
                let answer = null;
                if (userQuestions.canAskUser) {
                    // alter PATH question by OS
                    let pathQuestion = "May we add the Zowe bin directory to your\nPATH in your ";
                    if (osPlatform === "win32") {
                        pathQuestion += "permanent user environment";
                    }
                    else {
                        pathQuestion += ".profile file";
                    }
                    pathQuestion += " [y or n] ? ";
                    // ask user for permission to update PATH
                    answer = yield imperative_1.CliUtils.readPrompt(pathQuestion);
                }
                else {
                    // don't ask, just use default
                    answer = userQuestions.addBinToPathVal;
                }
                if (answer !== null && answer === "y" || answer === "Y") {
                    // user wants us to do it for him/her
                    if (osPlatform === "win32") {
                        userInfoMsg += yield this.addZoweBinOnWindows(pathToZoweBin);
                    }
                    else {
                        userInfoMsg += this.addZoweBinOnPosix(pathToZoweBin);
                    }
                }
                else {
                    userInfoMsg += `\n\nManually add '${pathToZoweBin}' to your PATH.` +
                        "\nOtherwise, you will continue to run the classic Zowe CLI interpreter.";
                }
                // when zowe/bin not already on path, user needs a new terminal
                userInfoMsg += "\n\n" + EnableDaemonHandler.openNewTerminalMsg;
            } // end zowe/bin not in path
            return userInfoMsg;
        });
    }
    /**
     * Add our .zowe/bin directory to the front of the user's PATH on Windows.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    addZoweBinOnWindows(pathToZoweBin) {
        return __awaiter(this, void 0, void 0, function* () {
            let userInfoMsg = "";
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
                const ioOptions = ["pipe", "pipe", "pipe"];
                const setxPath = process.env.SystemRoot ? nodeJsPath.join(process.env.SystemRoot, 'System32', 'setx.exe') : 'setx.exe';
                const spawnResult = (0, child_process_1.spawnSync)(setxPath, ["zowe_set_env_test", pathToZoweBin + ";" + process.env.PATH], {
                    stdio: ioOptions,
                    shell: false
                });
                if (spawnResult.stdout) {
                    userInfoMsg += spawnResult.stdout.toString();
                }
                if (spawnResult.stderr) {
                    userInfoMsg += spawnResult.stderr.toString();
                }
            }
            catch (err) {
                userInfoMsg += "Failed to run setx. Reason = " + err.message;
            }
            return userInfoMsg;
        });
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
    addZoweBinOnPosix(pathToZoweBin) {
        // Todo: Implement addZoweBinOnPosix
        const userInfoMsg = "";
        return userInfoMsg;
    }
}
exports.default = EnableDaemonHandler;
EnableDaemonHandler.openNewTerminalMsg = "To run further Zowe commands, close this terminal and open a new terminal.";
//# sourceMappingURL=Enable.handler.js.map