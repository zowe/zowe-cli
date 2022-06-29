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
import * as fs from "fs";
import * as os from "os";

import {
    ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError,
    IO, ISystemInfo, Logger, ProcessUtils
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
        } catch (impErr) {
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

        // form the path to the daemon PID file
        const daemonPidFileNm = nodeJsPath.normalize(ImperativeConfig.instance.cliHome +
            "/daemon/daemon_pid.json"
        );

        const myDaemonPid = DisableDaemonHandler.readMyDaemonPid(daemonPidFileNm);
        if (myDaemonPid) {
            // find processes running "node"
            let procArray;
            try {
                const findProc = require('find-process');
                procArray = await findProc('name', 'node', true);
            } catch (err) {
                /* This catch is not invoked, because the find-process.finders[].win32.utils.spawn function
                 * does not add an on("error") event handler for the child_process.spawn() function it calls.
                 * Thus, ENOENT is emitted as an uncatchable event. Thanks find-process!
                 * If a user gets an error like this, just tell him that powershell is not on his PATH.
                 * Typically it should be. The same type of error might occur on Linux if 'ps' were not
                 * on the user's PATH.
                 */
                let powerShellHint = "";
                if (err.message.includes("powershell.exe ENOENT")) {
                    powerShellHint = "\nPowershell.exe may not be on your PATH.";
                }
                throw new ImperativeError({
                    msg: "Failed while searching for the Zowe CLI daemon process.\n"
                        + `Reason: ${err}`
                        + powerShellHint
                });
            }

            // match and kill the running Zowe daemon for this user
            let foundOurDaemon = false;
            const zoweDaemonCmdRegEx = "node.*zowe.*--daemon$";
            for (const nextProc of procArray) {
                if (nextProc.cmd.match(zoweDaemonCmdRegEx) && nextProc.pid == myDaemonPid) {
                    process.kill(nextProc.pid, "SIGINT");
                    foundOurDaemon = true;
                    break;
                }
            }

            if (!foundOurDaemon) {
                Logger.getAppLogger().warn("No daemon running for user '" +
                    os.userInfo().username + "' with the recorded PID " + myDaemonPid
                );
            }
        } // end if myDaemonPid

        // delete the daemon PID file, so no false record of a daemon remains
        if (IO.existsSync(daemonPidFileNm)) {
            IO.deleteFile(daemonPidFileNm);
        }
    }

    /**
     * Read the process ID for a daemon running for the current user from
     * the pid file of the current user. The format of the PID file is:
     * {
     *     user: string
     *     pid: number
     * }
     *
     * @param daemonPidFileNm The file name containing the PID for the daemon.
     *
     * @returns The Pid of the daemon for the current user.
     *          Returns null if no daemon PID is recorded for the user.
     */
    private static readMyDaemonPid(daemonPidFileNm: string): Number | null {
        if (IO.existsSync(daemonPidFileNm)) {
            try {
                const pidFileContents = JSON.parse(fs.readFileSync(daemonPidFileNm, "utf-8"));
                const myUserName = os.userInfo().username;
                if (pidFileContents?.user != myUserName) {
                    Logger.getAppLogger().error(`Daemon PID file '${daemonPidFileNm}' contains ` +
                        `user '${pidFileContents?.user}'. It should be user '${myUserName}'.`
                    );
                    return null;
                }
                if (typeof(pidFileContents?.pid) === "number" && Number.isInteger(pidFileContents?.pid)) {
                    return pidFileContents.pid;
                } else {
                    Logger.getAppLogger().error(`Daemon PID file '${daemonPidFileNm}' ` +
                        `contains invalid PID value = '${pidFileContents?.pid}' of type ` +
                        typeof(pidFileContents?.pid)
                    );
                }
            } catch(caughtErr) {
                Logger.getAppLogger().error("Unable to read daemon PID file '" +
                    daemonPidFileNm + "'\nReason: " + caughtErr
                );
            }
        }

        // it's ok if no PID file exists
        return null;
    }
}
