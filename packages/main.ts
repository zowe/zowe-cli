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
import * as net from "net";


// TODO(Kelosky): handle prompting cases from login command
// TODO(Kelosky): can more of this be moved to imperative
// TODO(Kelosky): console needs to be logs

// get command args
const numOfParms = process.argv.length - 2;

let server: net.Server;
const defaultPort = 4000;
let port = defaultPort;
let useServer = false;

if (numOfParms > 0) {
    const parm = process.argv[2];

    const daemonKey = "--daemon";
    const daemonPortKey = "--daemon=";
    const portOffset = parm.indexOf(daemonKey);


    if (portOffset > -1) {
        const portKeyOffset = parm.indexOf(daemonPortKey);
        if (portKeyOffset > -1) {
            port = parseInt(parm.substr(daemonPortKey.length, parm.length - daemonPortKey.length), 10);
        }
        console.log(`port ${port}`);

        server = net.createServer((c) => {
            console.log('client connected');
            c.on('end', () => {
                console.log('client disconnected');
            });
            c.on('close', () => {
                console.log('client closed');
            })
            c.on('data', (data: Buffer) => {
                // TODO(Kelosky): get cwd from daemon client
                const stopKey = "--shutdown";
                const stopOffset = data.toString().indexOf(stopKey);
                if (stopOffset > -1) {
                    if (server) {
                        console.log("shutting down")
                        c.end();
                        server.close()
                    }
                } else {
                    console.log(`command ${data.toString()}`)
                    Imperative.parse(data.toString(), { stream: c });
                }
            })
        });

        server.on('error', (err) => {
            console.log(`server error`)
            throw err;
        });

        server.on('close', () => {
            console.log(`server closed`)
        })
    }


}

const timingApi = PerfTiming.api;

timingApi.mark("PRE_IMPORT_IMPERATIVE");

import { IImperativeConfig, Imperative } from "@zowe/imperative";
import { Constants } from "./Constants";
import { inspect } from "util";

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
        timingApi.mark("AFTER_INIT");
        timingApi.measure("imperative.init", "BEFORE_INIT", "AFTER_INIT");

        Imperative.api.appLogger.trace("Init was successful");

        timingApi.mark("BEFORE_PARSE");

        if (server) {
            server.listen(port, () => {
                console.log(`server bound ${port}`);
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
