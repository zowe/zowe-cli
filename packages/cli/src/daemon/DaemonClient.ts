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

import * as net from "net";
import { Duplex, Readable } from "stream";
import { DaemonRequest, IDaemonResponse, Imperative, ImperativeError } from "@zowe/imperative";

/**
 * Class for handling client connections to our persistent service (e.g. daemon mode)
 * @export
 * @class DaemonClient
 */
export class DaemonClient {
    /**
     * The character sent when Ctrl+C is pressed to terminate a process.
     * @internal
     */
    public static readonly CTRL_C_CHAR = "\x03";

    /**
     * The number of stdin bytes remaining to read from the daemon client.
     */
    private stdinBytesRemaining = 0;

    /**
     * Creates an instance of DaemonClient.
     * @param {net.Socket} mClient
     * @param {net.Server} mServer
     * @param {string} mOwner
     * @memberof DaemonClient
     */
    constructor(private mClient: net.Socket, private mServer: net.Server, private mOwner: string) {
    }

    /**
     * Run an instance of this client and wait for proper events
     * @memberof DaemonClient
     */
    public run() {
        Imperative.api.appLogger.trace('daemon client connected');
        this.mClient.on('end', this.end.bind(this));
        this.mClient.on('close', this.close.bind(this));
        this.mClient.on('data', this.data.bind(this));
    }

    /**
     * End event handler triggered when client disconnects
     * @private
     * @memberof DaemonClient
     */
    private end() {
        Imperative.api.appLogger.trace('daemon client disconnected');
    }

    /**
     * Close event handler triggered when client closes connection
     * @private
     * @memberof DaemonClient
     */
    private close() {
        Imperative.api.appLogger.trace('client closed');
    }

    /**
     * Shutdown the daemon server cleanly
     * @private
     * @memberof DaemonClient
     */
    private shutdown() {
        // NOTE(Kelosky): this is not exposed yet, but will allow for a clean shut down if
        // undocumented `--shutdown` is written to the persistent Processor.  It should be wrapped
        // in a new header and handled in DaemonClient.ts, e.g. x-zowe-daemon-shutdown
        Imperative.api.appLogger.debug("shutting down");
        this.mClient.write(`Terminating server`);
        this.mClient.end();
        this.mServer.close();
    }

    /**
     * Write data received from the daemon client to stdin.
     * @param data Data to write to stdin
     * @param expectedLength Expected length of the data to validate
     * @private
     * @memberof DaemonClient
     */
    private createStdinStream(data: Buffer, expectedLength: number): Readable | undefined {
        if (data == null) return;

        const stream = new Duplex();
        stream.push(data);
        this.stdinBytesRemaining = expectedLength - data.byteLength;

        if (this.stdinBytesRemaining > 0) {
            const outer: DaemonClient = this;  // eslint-disable-line @typescript-eslint/no-this-alias
            this.mClient.on("data", function listener(data) {
                stream.push(data);
                this.stdinBytesRemaining -= data.byteLength;

                if (this.stdinBytesRemaining <= 0) {
                    stream.push(null);
                    outer.mClient.removeListener("data", listener);
                }
            });
        } else {
            stream.push(null);
        }

        return stream;
    }

    /**
     * Data event handler triggered for whenever data comes in on a connection
     * @private
     * @param {Buffer} data
     * @memberof DaemonClient
     */
    private async data(data: Buffer) {
        if (this.stdinBytesRemaining > 0) return;

        // Split JSON body and binary data from multipart response
        const jsonEndIdx = data.indexOf("}" + DaemonRequest.EOW_DELIMITER);
        let jsonData: IDaemonResponse;
        let stdinData: Buffer;

        try {
            jsonData = JSON.parse((jsonEndIdx !== -1 ? data.slice(0, jsonEndIdx + 1) : data).toString());
            stdinData = jsonEndIdx !== -1 ? data.slice(jsonEndIdx + 2) : undefined;
        } catch (error) {
            Imperative.api.appLogger.logError(new ImperativeError({
                msg: "Failed to parse data received from daemon client",
                causeErrors: error
            }));
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            Imperative.api.appLogger.trace("First 1024 bytes of daemon request:\n", data.slice(0, 1024).toString());
            const responsePayload: string = DaemonRequest.create({
                stderr: "Failed to parse data received from daemon client:\n" + error.stack,
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        }

        let requestUser: string = undefined;
        if (jsonData.user != null) {
            try {
                requestUser = Buffer.from(jsonData.user, 'base64').toString();
            } catch (err) {
                Imperative.api.appLogger.error("The user field on a daemon request was malformed.");
            }
        }

        if (requestUser == null || requestUser === '') {
            // Someone tried connecting but is missing something important.
            Imperative.api.appLogger.warn("A connection was attempted without a valid user.");
            const responsePayload: string = DaemonRequest.create({
                stderr: "The daemon client did not supply user information or supplied bad information.\n",
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        } else if (requestUser != this.mOwner) {
            // Someone else is trying to use the daemon, and should be stopped.
            Imperative.api.appLogger.warn("The user '" + requestUser + "' attempted to connect.");
            const responsePayload: string = DaemonRequest.create({
                stderr: "The user '" + requestUser + "' cannot use this daemon.\n",
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        }

        if (jsonData.stdin != null) {
            if (jsonData.stdin !== DaemonClient.CTRL_C_CHAR) {
                // This data is related to a prompt reply so we ignore it
                return;
            } else if (this.mServer) {
                // Ctrl+C signal was sent so we shutdown the server
                this.shutdown();
            }
        } else {
            Imperative.commandLine = jsonData.argv.join(" ");
            Imperative.api.appLogger.trace(`daemon input command: ${Imperative.commandLine}`);
            Imperative.parse(jsonData.argv, {
                stream: this.mClient,
                stdinStream: this.createStdinStream(stdinData, jsonData.stdinLength),
                request: jsonData
            });
        }
    }
}
