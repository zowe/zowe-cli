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

import { Logger, ImperativeError } from "@zowe/imperative";
import { ClientChannel, Client } from "ssh2";
import { SshSession } from "./SshSession";
import { ZosUssMessages } from "./constants/ZosUss.messages";

export class Shell {
    public static readonly startCmdFlag = "@@START OF COMMAND@@";

    public static readonly connRefusedFlag = "ECONNREFUSED";

    public static readonly expiredPasswordFlag = "FOTS1668";

    public static executeSsh(session: SshSession,
        command: string,
        stdoutHandler: (data: string) => void): Promise<any> {
        const authsAllowed = ["none"];
        let hasAuthFailed = false;
        const promise = new Promise<any>((resolve, reject) => {
            const conn = new Client();

            // These are needed for authenticationHandler
            // The order is critical as this is the order of authentication that will be used.
            if (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") {
                authsAllowed.push("publickey");
            }
            if (session.ISshSession.password != null && session.ISshSession.password !== "undefined") {
                authsAllowed.push("password");
            }
            conn.on("ready", () => {
                conn.shell((err: any, stream: ClientChannel) => {
                    if (err) { throw err; }
                    let dataBuffer = "";
                    let dataToPrint = "";
                    let isUserCommand = false;
                    let rc: number;

                    // isolate the command
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    const cmd = command.slice(0, 75);

                    stream.on("exit", (exitcode: number) => {
                        Logger.getAppLogger().debug(`Return Code: ${exitcode}`);
                        if (dataBuffer.trim().length > 1) {
                            // normally the last line is "\r\n$ " and we don't care about it
                            // but we need to handle the case of an incomplete line at the end
                            // which can happen when commands terminate abruptly
                            stdoutHandler(dataBuffer.slice(0, dataBuffer.lastIndexOf("$")));
                        }
                        rc = exitcode;
                    });
                    stream.on("close", () => {
                        Logger.getAppLogger().debug("SSH connection closed");
                        if (!hasAuthFailed) stdoutHandler("\n");
                        conn.end();
                        resolve(rc);
                    });
                    stream.on("data", (data: Buffer | string) => {
                        Logger.getAppLogger().debug("\n[Received data begin]" + data + "[Received data end]\n");
                        // We do not know if password is expired until now.
                        // If it is, emit an error and shut down the stream.
                        if (dataBuffer.length === 0 && data.indexOf(this.expiredPasswordFlag) === 0) {
                            hasAuthFailed = true;
                            conn.emit("error", new Error(data.toString()));
                            stream.removeAllListeners("data");
                            stream.close();
                            return;
                        }
                        dataBuffer += data;
                        if (dataBuffer.includes("\r")) {
                            // when data is not received with complete lines,
                            // slice the last incomplete line and put it back to dataBuffer until it gets the complete line,
                            // rather than print it out right away
                            dataToPrint = dataBuffer.slice(0, dataBuffer.lastIndexOf("\r"));
                            dataBuffer = dataBuffer.slice(dataBuffer.lastIndexOf("\r"));

                            // check startCmdFlag: start printing out data
                            if (dataToPrint.match(new RegExp(`\n${this.startCmdFlag}`)) ||
                                dataToPrint.match(new RegExp("\\$ " + this.startCmdFlag))) {
                                dataToPrint = dataToPrint.slice(dataToPrint.indexOf(this.startCmdFlag) + this.startCmdFlag.length);
                                isUserCommand = true;
                            }

                            if (isUserCommand && dataToPrint.match(/\$ exit/)) {
                                // if exit found, print out stuff before exit, then stop printing out.
                                dataToPrint = dataToPrint.slice(0, dataToPrint.indexOf("$ exit"));
                                stdoutHandler(dataToPrint);
                                dataToPrint = "";
                                isUserCommand = false;
                            }
                            else if (isUserCommand && dataToPrint.length != 0) {
                                if (!dataToPrint.startsWith('\r\n$ '+cmd) && !dataToPrint.startsWith('\r<')){
                                    //only prints command output
                                    stdoutHandler(dataToPrint);
                                    dataToPrint = "";
                                }
                            }
                        }
                    });

                    // exit multiple times in case of nested shells
                    stream.write(`export PS1='$ '\necho ${this.startCmdFlag}\n${command}\n` +
                    `exit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\n`);
                    stream.end();
                });
            });
            conn.on("error", (err: Error) => {
                if (err.message.startsWith(this.expiredPasswordFlag)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.expiredPassword.message
                    }));
                } else if (err.message.includes(ZosUssMessages.allAuthMethodsFailed.message)) {
                    hasAuthFailed = true;
                    reject(new ImperativeError({
                        msg: ZosUssMessages.allAuthMethodsFailed.message
                    }));
                }
                // throw error only when authentication didn't fail.
                else if (!hasAuthFailed && err.message.includes(ZosUssMessages.handshakeTimeout.message)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.handshakeTimeout.message
                    }));
                } else if (err.message.includes(this.connRefusedFlag)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.connectionRefused.message + ":\n" + err.message
                    }));
                } else {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.unexpected.message + ":\n" + err.message
                    }));
                }
            });
            conn.connect({
                host: session.ISshSession.hostname,
                port: session.ISshSession.port,
                username: session.ISshSession.user,
                password: session.ISshSession.password,
                privateKey: (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") ?
                    require("fs").readFileSync(session.ISshSession.privateKey) : "",
                passphrase: session.ISshSession.keyPassphrase,
                authHandler: this.authenticationHandler(authsAllowed),
                readyTimeout: (session.ISshSession.handshakeTimeout != null && session.ISshSession.handshakeTimeout !== undefined) ?
                    session.ISshSession.handshakeTimeout : 0
            } as any);
        });
        return promise;
    }

    public static async executeSshCwd(session: SshSession,
        command: string,
        cwd: string,
        stdoutHandler: (data: string) => void): Promise<any> {
        const cwdCommand = `cd ${cwd} && ${command}`;
        return this.executeSsh(session, cwdCommand, stdoutHandler);
    }

    private static authenticationHandler(authsAllowed: string[]) {
        let authPos = 0;
        return (methodsLeft: string[], partialSuccess: boolean, callback: any) => {
            partialSuccess = true;
            if (authPos === authsAllowed.length) {
                return false;
            }
            return authsAllowed[authPos++];
        };
    }
}
