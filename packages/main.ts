#!/usr/bin/env node
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

import { PerfTiming } from "@zowe/perf-timing";
const timingApi = PerfTiming.api;

timingApi.mark("PRE_IMPORT_IMPERATIVE");

import { IImperativeConfig, Imperative } from "@zowe/imperative";
import { Constants } from "./Constants";
import { inspect } from "util";
import * as net from "net";

let sock: net.Socket;

// TODO(Kelosky): if we remove this, imperative fails to find config in package.json & we must debug this.
const config: IImperativeConfig = {
    configurationModule: __dirname + "/imperative"
};

(async () => {
    timingApi.mark("POST_IMPORT_IMPERATIVE");
    timingApi.measure("time to get into main function", "PRE_IMPORT_IMPERATIVE", "POST_IMPORT_IMPERATIVE");

    try {
        timingApi.mark("BEFORE_INIT");
        await Imperative.init(config);

        // TODO(Kelosky): handle prompting cases from login command
        // TODO(Kelosky): can more of this be moved to imperative
        // TODO(Kelosky): console needs to be logs
        // TODO(Kelosky): cwd likely broken
        // TODO(Kelosky): help web broken
        // TODO(Kelosky): prompt* broken - hangs, must restart daemon
        // TODO(Kelosky): login broken
        // TODO(Kelosky): timeout on connection for both sides to allow later reconnect
        // TODO(Kelosky): display daemon cli (Rust client) help

        // get command args
        const numOfParms = process.argv.length - 2;

        let server: net.Server;
        const defaultPort = 4000;
        let port = defaultPort;

        if (numOfParms > 0) {
            const parm = process.argv[2];

            // NOTE(Kelosky): undocumented `--daemon` or `--daemon=<PORT>`
            const daemonKey = "--daemon";
            const daemonPortKey = "--daemon=";
            const portOffset = parm.indexOf(daemonKey);

            if (portOffset > -1) {
                const portKeyOffset = parm.indexOf(daemonPortKey);
                if (portKeyOffset > -1) {
                    port = parseInt(parm.substr(daemonPortKey.length, parm.length - daemonPortKey.length), 10);
                }
                Imperative.api.appLogger.debug(`daemon server port ${port}`);

                server = net.createServer((c) => {
                    sock = c;
                    Imperative.api.appLogger.trace('daemon client connected');
                    c.on('end', () => {
                        Imperative.api.appLogger.trace('daemon client disconnected');
                    });
                    c.on('close', () => {
                        Imperative.api.appLogger.trace('client closed');
                    });
                    c.on('data', (data: Buffer) => {
                        // TODO(Kelosky): get cwd from daemon client
                        const stopKey = "--shutdown";
                        const stopOffset = data.toString().indexOf(stopKey);
                        if (stopOffset > -1) {
                            if (server) {
                                Imperative.api.appLogger.debug("shutting down")
                                c.end();
                                server.close()
                            }
                        } else {
                            Imperative.api.appLogger.trace(`daemon input command: ${data.toString()}`)
                            Imperative.commandLine = data.toString();
                            Imperative.parse(data.toString(), { stream: c });
                        }
                    })
                });

                server.on('error', (err) => {
                    Imperative.api.appLogger.error(`daemon server error: ${err}`)
                    throw err;
                });

                server.on('close', () => {
                    Imperative.api.appLogger.debug(`server closed`)
                })
            }
        }

        timingApi.mark("AFTER_INIT");
        timingApi.measure("imperative.init", "BEFORE_INIT", "AFTER_INIT");

        Imperative.api.appLogger.trace("Init was successful");

        timingApi.mark("BEFORE_PARSE");

        if (server) {
            server.listen(port, () => {
                Imperative.api.appLogger.debug(`daemon server bound ${port}`);
                Imperative.console.info(`server bound ${port}`)
            });
        } else {
            Imperative.parse();
        }

        timingApi.mark("AFTER_PARSE");
        timingApi.measure("Imperative.parse", "BEFORE_PARSE", "AFTER_PARSE");
    } catch (initErr) {
        Imperative.console.fatal("Error initializing " + Constants.DISPLAY_NAME +
            ":\n "
            + inspect(initErr));
        process.exit(1);
    }
})();
