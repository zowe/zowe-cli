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

import { Logger, ImperativeError } from "@brightside/imperative";
import { ClientChannel } from "ssh2";
import { SshSession } from "../SshSession";
import { ZosUssMessages } from "../api/constants/ZosUss.messages";
import { Stream } from "stream";
const Client = require("ssh2");

// These are needed for authenticationHandler
let authPos = 0;
const authsAllowed = ["none"];
let hasAuthFailed = false;

export class Shell {

    public static executeSsh(session: SshSession,
                             command: string,
                             stdoutHandler: (data: string) => void): Promise<any> {
        const promise = new Promise<any>((resolve,reject) => {
            // These are needed for authenticationHandler
            // The order is critical as this is the order of authentication that will be used.
            if(session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") {
                authsAllowed.push("publickey");
            }
            if(session.ISshSession.password != null && session.ISshSession.password !== "undefined") {
                authsAllowed.push("password");
            }
            const conn = new Client();

            conn.on("ready", () => {
                conn.shell((err: any, stream: ClientChannel) => {
                    if (err) { throw err; }

                    stream.on("close", () => {
                        conn.end();
                        resolve();
                    });
                    stream.on("data", (data: string) => {
                        stdoutHandler(data);
                    });

                    // exit multiple times in case of nested shells
                    stream.end(command + "\nexit\nexit\nexit\nexit\nexit\nexit\nexit\nexit\n");
                });
            });
            conn.connect({
                host: session.ISshSession.hostname,
                port: session.ISshSession.port,
                username: session.ISshSession.user,
                password: session.ISshSession.password,
                privateKey: (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") ?
                require("fs").readFileSync(session.ISshSession.privateKey) : "",
                passphrase: session.ISshSession.keyPassphrase,
                authHandler: Shell.authenticationHandler,
                readyTimeout: 2000
            });
            conn.on("error", (err: Error) => {
                if (err.message.includes(ZosUssMessages.allAuthMethodsFailed.message)) {
                    hasAuthFailed = true;
                    reject(new ImperativeError({
                        msg: ZosUssMessages.allAuthMethodsFailed.message
                    }));
                }
                // throw error only when authentication didn't fail.
                else if( !hasAuthFailed && err.message.includes(ZosUssMessages.handshakeTimeout.message)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.handshakeTimeout.message,
                    }));
                } else {
                    throw err;
                }
            });
        });
        return promise;
    }

    public static async executeSshCwd(session: SshSession,
                                      command: string,
                                      cwd: string,
                                      stdoutHandler: (data: string) => void): Promise<any> {
        const cwdCommand = `cd ${cwd} && ${command}`;
        await this.executeSsh(session, cwdCommand, stdoutHandler);
    }

    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }

    private static authenticationHandler(methodsLeft: string[], partialSuccess: boolean, callback: any) {
        partialSuccess = true;
        if (authPos === authsAllowed.length) {
            return false;
        }
        return authsAllowed[authPos++];
    }
}
