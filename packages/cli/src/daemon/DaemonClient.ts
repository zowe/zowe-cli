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

import * as crypto from "crypto";
import * as net from "net";
import * as path from "path";
import { PassThrough, Readable } from "stream";
import { DaemonRequest, IDaemonContext, IDaemonResponse, Imperative, ImperativeError, IO } from "@zowe/imperative";
import { DaemonUtil } from "./DaemonUtil";
import { IDaemonHandshakeReply } from "./doc/IDaemonHandshakeReply";

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
     * Number of random bytes in a handshake nonce.
     * @internal
     */
    private static readonly NONCE_LENGTH = 16;

    /**
     * The number of stdin bytes remaining to read from the daemon client.
     */
    private stdinBytesRemaining = 0;

    /**
     * The nonce we generated for the client during the identity handshake.
     * Undefined until the handshake has taken place on this connection.
     * @private
     */
    private mServerNonce?: string;

    /**
     * Whether the identity handshake has completed on this connection. Until
     * this is true, the only message we will process is the client's hello.
     * @private
     */
    private mHandshakeDone = false;

    /**
     * Creates an instance of DaemonClient.
     * @param {net.Socket} mClient
     * @param {net.Server} mServer
     * @param {string} mOwner
     * @param {string} mDaemonToken Secret token, known only to this daemon and
     *      to whoever can read the owner-only PID file, used to derive the
     *      keyed proofs exchanged during the identity handshake. Never sent
     *      on the wire itself.
     * @memberof DaemonClient
     */
    constructor(private mClient: net.Socket, private mServer: net.Server, private mOwner: string, private readonly mDaemonToken: string) {
        if (!this.mDaemonToken) {
            throw new ImperativeError({msg: "Unable to initialize the Daemon Client without a proper token"});
        }
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
     * Shutdown the daemon server cleanly. This is triggered when our EXE
     * sends Control-C in the stdin property of its request object.
     * @private
     * @memberof DaemonClient
     */
    private shutdown() {
        Imperative.api.appLogger.debug("shutting down");

        const pidFilePath = path.join(DaemonUtil.getDaemonDir(), "daemon_pid.json");
        if (IO.existsSync(pidFilePath)) {
            try {
                IO.deleteFile(pidFilePath);
            } catch(err) {
                Imperative.api.appLogger.error("Failed to delete file '" + pidFilePath +
                    "'\nDetails = " + err.message
                );
            }
        }

        this.mClient.end();
        this.mServer.close();
    }

    /**
     * Create readable stream for stdin data received from the daemon client.
     * @param data First chunk of stdin data
     * @param expectedLength Expected byte length of stdin data
     * @private
     * @memberof DaemonClient
     */
    private createStdinStream(data: Buffer, expectedLength: number): Readable {
        const stream = new PassThrough();
        stream.write(data);
        this.stdinBytesRemaining = expectedLength - data.byteLength;

        if (this.stdinBytesRemaining > 0) {
            // Handle really large stdin data that is buffered and received in multiple chunks
            this.mClient.pipe(stream);
            const outer: DaemonClient = this;  // eslint-disable-line @typescript-eslint/no-this-alias
            this.mClient.on("data", function listener(data) {
                outer.stdinBytesRemaining -= data.byteLength;

                if (outer.stdinBytesRemaining <= 0) {
                    outer.mClient.removeListener("data", listener);
                    outer.mClient.unpipe(stream);
                    stream.end();
                }
            });
        } else {
            stream.end();
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
            jsonData = JSON.parse((jsonEndIdx !== -1 ? data.subarray(0, jsonEndIdx + 1) : data).toString());
            stdinData = jsonEndIdx !== -1 ? data.subarray(jsonEndIdx + 2) : undefined;
        } catch (error) {
            Imperative.api.appLogger.logError(new ImperativeError({
                msg: "Failed to parse data received from daemon client",
                causeErrors: error
            }));
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            Imperative.api.appLogger.trace("First 1024 bytes of daemon request:\n", data.subarray(0, 1024).toString());
            const responsePayload: string = DaemonRequest.create({
                stderr: "Failed to parse data received from daemon client:\n" + error.stack,
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        }

        if (!this.mHandshakeDone) {
            this.handleHandshake(jsonData);
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

        // The proof can only be produced by reading the secret token from the owner-only PID file.
        if (!this.isValidClientProof(jsonData.clientProof)) {
            Imperative.api.appLogger.warn("A connection was attempted with a missing or invalid daemon proof.");
            const responsePayload: string = DaemonRequest.create({
                stderr: "The daemon client did not supply a valid daemon proof. " +
                    "Try restarting the daemon with 'zowe daemon restart'.\n",
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        }
        // The proof is only used for authenticating the request; clear it so it is not logged or forwarded.
        jsonData.clientProof = undefined;

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
            const context: IDaemonContext = { stream: this.mClient, response: jsonData };
            if (stdinData != null) {
                context.stdinStream = this.createStdinStream(stdinData, jsonData.stdinLength);
            }
            Imperative.parse(jsonData.argv, context);
        }
    }

    /**
     * Handle the first message on a connection, which must be a "hello"
     * containing only a client-chosen nonce. We prove that we hold the secret
     * daemon token by responding with a keyed proof bound to that nonce,
     * before accepting any other request on this connection.
     *
     * @private
     * @param {IDaemonResponse} jsonData The parsed first message on this connection.
     * @memberof DaemonClient
     */
    private handleHandshake(jsonData: IDaemonResponse) {
        if (typeof jsonData.nonce !== "string" || jsonData.nonce.length === 0) {
            Imperative.api.appLogger.warn("A connection was attempted without completing the identity handshake.");
            const responsePayload: string = DaemonRequest.create({
                stderr: "The daemon client did not begin the connection with a valid handshake.\n",
                exitCode: 1
            });
            this.mClient.write(responsePayload);
            this.mClient.end();
            return;
        }

        this.mServerNonce = crypto.randomBytes(DaemonClient.NONCE_LENGTH).toString("base64");
        const reply: IDaemonHandshakeReply = {
            nonce: this.mServerNonce,
            serverProof: this.computeProof("srv:", jsonData.nonce)
        };
        this.mHandshakeDone = true;
        this.mClient.write(JSON.stringify(reply) + DaemonRequest.EOW_DELIMITER);
    }

    /**
     * Compute the base64-encoded HMAC-SHA256 of `context` + `nonce`, keyed by
     * our secret daemon token. Used for both directions of the handshake: we
     * prove ourselves with context "srv:", and verify the client's proof with
     * context "cli:". The raw token itself is never sent on the wire.
     *
     * @private
     * @param {string} context Either "srv:" or "cli:".
     * @param {string} nonce The nonce that this proof is bound to.
     * @returns {string} The base64-encoded proof.
     * @memberof DaemonClient
     */
    private computeProof(context: string, nonce: string): string {
        return crypto.createHmac("sha256", this.mDaemonToken).update(context).update(nonce).digest("base64");
    }

    /**
     * Determine whether the proof supplied by the daemon client matches the
     * proof we expect, given the server nonce established during the identity
     * handshake on this connection.
     *
     * The comparison is performed in constant time to avoid leaking how much of
     * the proof matched via timing differences.
     *
     * @private
     * @param {string} candidate The proof supplied by the daemon client.
     * @returns {boolean} True if the proof is present and matches our expectation.
     * @memberof DaemonClient
     */
    private isValidClientProof(candidate: string): boolean {
        if (this.mServerNonce == null || typeof candidate !== "string" || candidate.length === 0) {
            return false;
        }

        const expected = Buffer.from(this.computeProof("cli:", this.mServerNonce));
        const actual = Buffer.from(candidate);

        // timingSafeEqual requires equal-length buffers, so a length mismatch is
        // an immediate (and safe) rejection.
        if (expected.length !== actual.length) {
            return false;
        }

        return crypto.timingSafeEqual(expected, actual);
    }
}
