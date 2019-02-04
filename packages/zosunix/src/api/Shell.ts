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

import { SubmitJobs } from "../../../zosjobs/src/api/SubmitJobs";
import { Logger, AbstractSession } from "@brightside/imperative";
import { Client, ClientChannel } from "ssh2";

const bpxbatch = `//BATCHTRY JOB CLASS=A,MSGCLASS=A,NOTIFY=&SYSUID
//BATCH   EXEC PGM=BPXBATCH,REGION=0M,MEMLIMIT=6G
//STDOUT DD SYSOUT=*
//STDERR DD SYSOUT=*
/*
//STDPARM  DD   *
SH`;

export class Shell {
    public static async executeCommand(session: AbstractSession, command: string): Promise<string> {
        const bpxbatchCmd = `${bpxbatch}\n${command}`;
        const job: any = await SubmitJobs.submitJclString(session, bpxbatchCmd, {jclSource : "stdin", viewAllSpoolContent: true});
        const indexOfStdout = 3;
        this.log.trace("Spool File %s", JSON.stringify(job[indexOfStdout].data));

        return job[indexOfStdout].data.toString();
    }

    public static async executeCommandCwd(session: AbstractSession, command: string, cwd: string): Promise<string> {
        const bpxbatchCmd = `${bpxbatch}\ncd ${cwd};${command}`;
        const job: any = await SubmitJobs.submitJclString(session, bpxbatchCmd, {jclSource : "stdin", viewAllSpoolContent: true});
        const indexOfStdout = 3;
        this.log.trace("Spool File %s", JSON.stringify(job[indexOfStdout].data));

        return job[indexOfStdout].data.toString();
    }

    public static executeSsh(session: AbstractSession, command: string, callback: any): void {
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
                process.stdout.write(stream === undefined ? "Stream undefined" : "Stream defined");
                callback(stream);
            });
        });
        conn.connect({
            host: session.ISession.hostname,
            // TODO: make the port configurable
            port: 22,
            username: session.ISession.user,
            password: session.ISession.password
        });
    }

    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
