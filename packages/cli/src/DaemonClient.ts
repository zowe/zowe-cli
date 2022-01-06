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

import { DaemonRequest, IDaemonResponse, Imperative } from "@zowe/imperative";
import * as net from "net";

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
     * Creates an instance of DaemonClient.
     * @param {net.Socket} mClient
     * @param {net.Server} mServer
     * @memberof DaemonClient
     */
    constructor(private mClient: net.Socket, private mServer: net.Server) {
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
    private writeToStdin(data: string, expectedLength: number) {
        // stdin.isTTY is checked by get-stdin and should be false if stdin contains valid data.
        // We set it to false if the number of bytes received matches the expected `stdinLength`.
        const stdin: any = process.stdin;
        Object.defineProperty(process.stdin, "isTTY", { value: data.length !== expectedLength });

        // Normally Node.js reads from process.stdin only once, and the stream is not reusable.
        // To work around this, we store a copy of the `_readableState` object before stdin has been used.
        // To reuse stdin, we clear any old data and reset the `_readableState` object back to its initial value.
        if (stdin._readableStateOld == null) {
            stdin._readableStateOld = { ...stdin._readableState };
        } else {
            if (!process.stdin.readableEnded) {
                process.stdin.read();
            }
            process.stdin.removeAllListeners();
            stdin._readableState = { ...stdin._readableStateOld };
        }

        // Calling stdin.write throws an EPIPE error because Node.js thinks the stream is read-only.
        // So we simulate calls to stdin.write and stdin.end by pushing to the internal buffer.
        process.stdin.push(data);
        process.stdin.push(null);
    }

    /**
     * Data event handler triggered for whenever data comes in on a connection
     * @private
     * @param {Buffer} data
     * @memberof DaemonClient
     */
    private data(data: Buffer) {
        // Split JSON body and binary data from multipart response
        const stringData = data.toString();
        const jsonEndIdx = stringData.indexOf("}" + DaemonRequest.EOW_DELIMITER);
        const jsonData: IDaemonResponse = JSON.parse(jsonEndIdx !== -1 ? stringData.slice(0, jsonEndIdx + 1) : stringData);
        const stdinData = jsonEndIdx !== -1 ? stringData.slice(jsonEndIdx + 2) : undefined;

        if (jsonData.stdin != null) {
            if (jsonData.stdin !== DaemonClient.CTRL_C_CHAR) {
                // This data is related to a prompt reply so we ignore it
                return;
            } else if (this.mServer) {
                // Ctrl+C signal was sent so we shutdown the server
                this.shutdown();
            }
        } else {
            if (stdinData != null) {
                this.writeToStdin(stdinData, jsonData.stdinLength);
            }

            Imperative.commandLine = jsonData.argv.join(" ");
            Imperative.api.appLogger.trace(`daemon input command: ${Imperative.commandLine}`);
            Imperative.parse(jsonData.argv, { stream: this.mClient, daemonResponse: jsonData });
        }
    }
}
