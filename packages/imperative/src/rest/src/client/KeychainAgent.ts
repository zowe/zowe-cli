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

import * as http from "http";
import * as https from "https";
import * as net from "net";
import { Agent } from "agent-base";
import { AbstractSession } from "../session/AbstractSession";

/**
 * HTTPS Agent that supports certificates stored in the macOS Keychain or Windows Certificate Store,
 * including non-exportable private keys (e.g. Windows CNG, macOS Secure Enclave).
 *
 * On macOS, if the private key is exportable it is used directly by Node's TLS stack.
 * Otherwise (and always on Windows), TLS is handled by native OS APIs via a Rust helper.
 */
export class KeychainAgent extends Agent {
    /**
     * Creates a new KeychainAgent
     * @param certAccount - The account/label name for the identity in the keychain
     * @param options - Additional HTTPS agent options
     */
    constructor(private certAccount: string, options?: https.AgentOptions) {
        super(options);
    }

    /**
     * Returns the socket to use for each outgoing request.
     * @param _req - The outgoing request
     * @param options - The HTTPS agent options
     * @returns The socket to use for the request
     */
    public async connect(_req: http.ClientRequest, options: https.AgentOptions): Promise<net.Socket> {
        return this.buildPipeSocket(options);
    }

    // Loaded on first use via the Node require cache.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    private get keyring() { return require("@zowe/secrets-for-zowe-sdk").keyring; }

    /**
     * Non-exportable key path (Windows / macOS Secure Enclave): TLS is handled by a Rust
     * helper that uses OS APIs (Schannel / Secure Transport) and proxies plaintext over a
     * local TCP socket, which is returned as a duck-typed TLS socket to Node's HTTP layer.
     */
    private async buildPipeSocket(options: https.AgentOptions): Promise<net.Socket> {
        if (typeof this.keyring.createTlsPipe !== "function") {
            throw new Error(
                "createTlsPipe is not supported by the current version of @zowe/secrets-for-zowe-sdk. " +
                "Please rebuild the native bindings."
            );
        }

        const host = options.servername || options.host || "localhost";
        const port = options.port || AbstractSession.DEFAULT_HTTPS_PORT;
        const rejectUnauthorized = options.rejectUnauthorized ?? true;

        const localPath: string = await this.keyring.createTlsPipe(host, port, this.certAccount, rejectUnauthorized);

        return new Promise<net.Socket>((resolve, reject) => {
            const socket = new net.Socket();

            // Mark the socket as TLS-like so Node's HTTPS layer accepts it.
            (socket as any).encrypted = true;
            (socket as any).authorized = true;
            (socket as any).alpnProtocol = false;
            (socket as any).getPeerCertificate = () => ({});

            // Annotate errors with context before they propagate.
            socket.on("error", (err: Error) => {
                if (!(err as any).keychainAgentContext) {
                    (err as any).keychainAgentContext =
                        `KeychainAgent TLS pipe — cert: "${this.certAccount}", remote: ${host}:${port}`;
                    err.message = `${err.message} (${(err as any).keychainAgentContext})`;
                }
            });

            socket.connect(localPath, () => resolve(socket));
            socket.once("error", reject);
        });
    }
}
