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

import { Imperative } from "@zowe/imperative";
import * as net from "net";
import { DaemonClient } from "./DaemonClient";

// TODO(Kelosky): handle prompting cases from login command
// TODO(Kelosky): help web broken
// TODO(Kelosky): prompt* broken - hangs, must restart daemon
// TODO(Kelosky): login broken
// TODO(Kelosky): timeout on connection for both sides to allow later reconnect
// TODO(Kelosky): display daemon cli (Rust client) help, e.g. fast-zowe profiles -rfj (missing extra `-`)
// TODO(Kelosky): some command errors hang and daemon must be restarted
// TODO(Kelosky): colors dont come through on some terminals
// TODO(Kelosky): stderr and exit code 1

/**
 * Initial paramter parse to handle conditionally starting as a persistent process (e.g. daemon mode)
 * @export
 * @class Processor
 */
export class Processor {

    /**
     * Default port number
     * @private
     * @static
     * @memberof Processor
     */
    private static readonly DEFAULT_PORT = 4000;

    /**
     * Undocumented paramter for launching in server mode
     * @private
     * @static
     * @memberof Processor
     */
    private static readonly DAEMON_KEY = "--daemon";

    /**
     * Undocumented paramter for launching in server mode with a port
     * @private
     * @static
     * @memberof Processor
     */
    private static readonly DAEMON_PORT_KEY = "--daemon=";

    /**
     * Hold instance of a running server
     * @private
     * @type {net.Server}
     * @memberof Processor
     */
    private mServer: net.Server;

    /**
     * Hold current port number for the server
     * @private
     * @type {number}
     * @memberof Processor
     */
    private mPort: number;

    /**
     * Indicator for whether or not to start the server
     * @private
     * @type {boolean}
     * @memberof Processor
     */
    private mStartServer: boolean;


    /**
     * Creates an instance of Processor.
     * @param {string[]} mParms
     * @memberof Processor
     */
    constructor(private mParms: string[]) { }

    /**
     * Initialize our processor parse and optionally start the server
     * @memberof Processor
     */
    public init() {

        this.initialParse();
        if (this.startServer) {

            this.mServer = net.createServer((c) => {
                new DaemonClient(c, this.mServer).run();
            });

            this.mServer.on('error', this.error.bind(this));
            this.mServer.on('close', this.close.bind(this));
        }
    }

    /**
     * Method to immediately parse or otherwise start the server for later processing from
     * incoming socket connections.
     * @memberof Processor
     */
    public process() {
        if (this.mServer) {
            this.mServer.listen(this.mPort, () => {
                Imperative.api.appLogger.debug(`daemon server bound ${this.mPort}`);
                Imperative.console.info(`server bound ${this.mPort}`)
            });
        } else {
            Imperative.parse();
        }
    }

    /**
     * Server close handler
     * @private
     * @memberof Processor
     */
    private close() {
        Imperative.api.appLogger.debug(`server closed`)
    }

    /**
     * Server error handler
     * @private
     * @param {Error} err
     * @memberof Processor
     */
    private error(err: Error) {
        Imperative.api.appLogger.error(`daemon server error: ${err.message}`)
        throw err;
    }

    /**
     * Perform initial parsing of undocumented parameters
     * @private
     * @memberof Processor
     */
    private initialParse() {
        const numOfParms = this.mParms.length - 2;
        this.mPort = Processor.DEFAULT_PORT;

        if (numOfParms > 0) {
            const parm = this.mParms[2];

            /**
             * NOTE(Kelosky): For now, we use an undocumented paramter `--daemon` or `--daemon=<PORT>`.  If found first,
             * we bypass `yargs` and begin running this as a persistent Processor.
             */
            const portOffset = parm.indexOf(Processor.DAEMON_KEY);

            if (portOffset > -1) {
                this.startServer = true;
                const portKeyOffset = parm.indexOf(Processor.DAEMON_PORT_KEY);
                // manually parse off the <PORT> if found
                if (portKeyOffset > -1) {
                    this.mPort = parseInt(parm.substr(Processor.DAEMON_PORT_KEY.length, parm.length - Processor.DAEMON_PORT_KEY.length), 10);
                    // otherwise take the <PORT> from ENV var if found
                } else if (process.env.ZOWE_DAEMON) {
                    try {
                        this.mPort = parseInt(process.env.ZOWE_DAEMON, 10);
                    } catch (err) {
                        // do nothing
                    }
                }
                Imperative.api.appLogger.debug(`daemon server port ${this.mPort}`);
            }
        }
    }

    /**
     * Get whether or not to start the server
     * @private
     * @memberof Processor
     */
    private get startServer() {
        return this.mStartServer;
    }

    /**
     * Set whether or not to start the server
     * @private
     * @memberof Processor
     */
    private set startServer(startServer) {
        this.mStartServer = startServer;
    }
}

