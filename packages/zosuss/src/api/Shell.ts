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

import { Logger } from "@brightside/imperative";
import { Client, ClientChannel } from "ssh2";
import { SshSession } from "../SshSession";

export class Shell {
    public static executeSsh(session: SshSession, command: string, callback: any): void {
        const conn = new Client();
        let privateKeyPath;
        try {
            privateKeyPath = require("fs").readFileSync(session.ISshSession.privateKey);
        } catch (err) {
            privateKeyPath = "";
        }

        conn.on("ready", () => {
            conn.shell((err: any, stream: ClientChannel) => {
                if (err) { throw err; }

                stream.on("close", () => {
                    conn.end();
                    process.stdout.write("Closed connection\n");
                });
                // exit multiple times in case of multiple shells running in depth
                stream.end(command + "\nexit\nexit\nexit\nexit\nexit\nexit\nexit\nexit\n");
                callback(stream);
            });
        });
        conn.connect({
            host: session.ISshSession.hostname,
            port: session.ISshSession.port,
            username: session.ISshSession.user,
            password: session.ISshSession.password,
            privateKey: privateKeyPath,
            passphrase: session.ISshSession.keyPassphrase
        });
        conn.on("error", (err) => {
            process.stderr.write(err +
                ". Check Zowe ssh-profile:" +
                "\n\thost: " + session.ISshSession.hostname +
                "\n\tport: " + session.ISshSession.port +
                "\n\tusername: " + session.ISshSession.user +
                "\n\tpassword: " + session.ISshSession.password +
                "\n\tprivateKey: " + session.ISshSession.privateKey +
                "\n\tpassphrase: " + session.ISshSession.keyPassphrase +
                "\n"
            );
        });
    }

    public static executeSshCwd(session: SshSession, command: string, cwd: string, callback: any): void {
        const cwdCommand = `cd ${cwd} && ${command}`;
        this.executeSsh(session, cwdCommand, callback);
    }

    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
