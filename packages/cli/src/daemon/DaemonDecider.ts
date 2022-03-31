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

import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { Imperative } from "@zowe/imperative";
import { DaemonClient } from "./DaemonClient";
import { IDaemonPidForUser } from "./doc/IDaemonPidForUser";

// TODO(Kelosky): handle prompting cases from login command
// TODO(Kelosky): prompt* broken - hangs, must restart daemon
// TODO(Kelosky): colors do not come through on some terminals (must be started via `node lib/main --daemon` to see colors)
// TODO(Kelosky): stderr
// TODO(Kelosky): plugins install

/**
 * Initial paramter parse to handle conditionally starting as a persistent process (e.g. daemon mode)
 * @export
 * @class DaemonDecider
 */
export class DaemonDecider {
    /**
     * Undocumented paramter for launching in server mode
     * @private
     * @static
     * @memberof DaemonDecider
     */
    private static readonly DAEMON_KEY = "--daemon";

    /**
     * Hold instance of a running server
     * @private
     * @type {net.Server}
     * @memberof DaemonDecider
     */
    private mServer: net.Server;

    /**
     * Hold current socket path for the server
     * @private
     * @type {number}
     * @memberof DaemonDecider
     */
    private mSocket: string;

    /**
     * Contains the path to the daemon directory.
     * It is intialized with our default location.
     * @private
     * @type {number}
     * @memberof DaemonDecider
     */
    private mDaemonDir: string = path.join(os.homedir(), ".zowe", "daemon");

    /**
     * Hold current owner for the server
     * @private
     * @type {number}
     * @memberof Processor
     */
    private mUser: string;

    /**
     * Indicator for whether or not to start the server
     * @private
     * @type {boolean}
     * @memberof DaemonDecider
     */
    private mStartServer: boolean;

    /**
     * Creates an instance of DaemonDecider.
     * @param {string[]} mParms
     * @memberof DaemonDecider
     */
    constructor(private mParms: string[]) { }

    /**
     * Initialize our DaemonDecider parse and optionally start the server
     * @memberof DaemonDecider
     */
    public init() {

        this.initialParse();
        if (this.startServer) {
            this.mUser = os.userInfo().username;
            this.mServer = net.createServer((c) => {
                new DaemonClient(c, this.mServer, this.mUser).run();
            });

            this.mServer.on('error', this.error.bind(this));
            this.mServer.on('close', this.close.bind(this));

            this.recordDaemonPid();
        }
    }

    /**
     * Method to immediately parse or otherwise start the server for later processing from
     * incoming socket connections.
     * @memberof DaemonDecider
     */
    public runOrUseDaemon() {
        if (this.mServer) {
            if (process.platform !== "win32" && fs.existsSync(this.mSocket)) {
                fs.unlinkSync(this.mSocket);
            }

            ["exit", "SIGINT", "SIGQUIT", "SIGTERM"].forEach((eventType: any) => {
                process.on(eventType, this.close.bind(this, true));
            });

            this.mServer.maxConnections = 1;
            this.mServer.listen(this.mSocket, () => {
                Imperative.api.appLogger.debug(`daemon server bound ${this.mSocket}`);
                Imperative.console.info(`server bound ${this.mSocket}`);
            });
        } else {
            Imperative.parse();
        }
    }

    /**
     * Record the process ID of the daemon that is being started for the current user.
     * On a multi-user system, each user gets his/her own daemon.
     *
     * @private
     * @memberof DaemonDecider
     */
    private recordDaemonPid() {
        const pidForUser: IDaemonPidForUser = {
            user: os.userInfo().username,
            pid: process.pid
        };

        const pidFilePath = path.join(this.mDaemonDir, "daemon_pid.json");
        const pidForUserStr = JSON.stringify(pidForUser, null, 2);

        try {
            fs.writeFileSync(pidFilePath, pidForUserStr);
        } catch(err) {
            throw new Error("Failed to write file '" + pidFilePath + "'\nDetails = " + err.message);
        }

        Imperative.api.appLogger.trace("Recorded daemon process ID into " + pidFilePath +
            "\n" + pidForUserStr
        );
    }

    /**
     * Server close handler
     * @private
     * @memberof DaemonDecider
     */
    private close(shouldExit?: boolean) {
        Imperative.api.appLogger.debug(`server closed`);
        if (shouldExit) {
            process.exit();
        }
    }

    /**
     * Server error handler
     * @private
     * @param {Error} err
     * @memberof DaemonDecider
     */
    private error(err: Error) {
        Imperative.api.appLogger.error(`daemon server error: ${err.message}`);
        throw err;
    }

    /**
     * Perform initial parsing of undocumented parameters
     * @private
     * @memberof DaemonDecider
     */
    private initialParse() {
        if (this.mParms.length > 2) {
            /**
             * NOTE(Kelosky): For now, we use an undocumented parameter `--daemon`.  If found first,
             * we bypass `yargs` and begin running this as a persistent Processor.
             */
            const parm = this.mParms[2];
            const daemonOffset = parm.indexOf(DaemonDecider.DAEMON_KEY);

            if (daemonOffset > -1) {
                this.startServer = true;

                if (process.platform === "win32") {
                    // On windows we use a pipe instead of a socket
                    if (process.env.ZOWE_DAEMON_PIPE) {
                        // user can choose some pipe path
                        this.mSocket = "\\\\.\\pipe\\" + process.env.ZOWE_DAEMON_PIPE;
                    } else {
                        // use default pipe path name
                        this.mSocket = `\\\\.\\pipe\\${os.userInfo().username}\\ZoweDaemon`;
                    }
                } else {
                    // Linux-like systems use domain sockets
                    if (process.env.ZOWE_DAEMON_DIR) {
                        // user can choose a daemon directory for storing runtime artifacts
                        this.mDaemonDir = process.env.ZOWE_DAEMON_DIR;
                    }
                    this.mSocket = path.join(this.mDaemonDir, "daemon.sock");
                }

                Imperative.api.appLogger.debug(`daemon server will listen on ${this.mSocket}`);
            }
        }
    }

    /**
     * Get whether or not to start the server
     * @private
     * @memberof DaemonDecider
     */
    private get startServer() {
        return this.mStartServer;
    }

    /**
     * Set whether or not to start the server
     * @private
     * @memberof DaemonDecider
     */
    private set startServer(startServer) {
        this.mStartServer = startServer;
    }
}

