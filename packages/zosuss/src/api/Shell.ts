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
import { Session } from "./index";

export class Shell {
    public static executeSsh(session: Session, command: string, callback: any): void {
        const conn = new Client();

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
            host: session.ISession.hostname,
            port: session.ISession.port,
            username: session.ISession.user,
            password: session.ISession.password
        });
    }

    public static executeSshCwd(session: Session, command: string, cwd: string, callback: any): void {
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
