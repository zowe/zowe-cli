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

import * as https from "https";
import * as net from "net";
import * as tls from "tls";
import { Socket } from "net";

/**
 * Custom HTTPS Agent that supports non-exportable private keys from macOS Keychain and Windows Certificate Store.
 * This agent delegates TLS connections to the native secrets-for-zowe-sdk using a local pipe bridge if the key is non-exportable.
 * If the key is exportable, it will fall back to using standard Node.js TLS with the exported key.
 */
export class KeychainAgent extends https.Agent {
    private certAccount: string;
    private cliHome: string;

    /**
     * Creates a new KeychainAgent
     * @param certAccount - The account/label name for the identity in the keychain
     * @param cliHome - The CLI home directory (used as service name, not used for native pipe but kept for compatibility)
     * @param options - Additional HTTPS agent options
     */
    constructor(certAccount: string, cliHome: string, options?: https.AgentOptions) {
        super({
            ...options,
            // Prevent default certificate loading
            rejectUnauthorized: options?.rejectUnauthorized ?? true
        });
        this.certAccount = certAccount;
        this.cliHome = cliHome;
    }

    /**
     * Override createConnection to use keychain identity for TLS
     */
    public createConnection(options: any, callback?: (err: Error | null, socket?: Socket) => void): Socket {
        const socket = new net.Socket();
        
        // Connect asynchronously and rely on the callback.
        // We do not return the socket synchronously to prevent Node.js
        // from writing to it before it's fully connected and duck-typed.
        this.connectWithBestMethod(socket, options, callback);

        return undefined as any;
    }

    /**
     * Convert DER-encoded data to PEM format
     */
    private derToPem(der: Buffer, type: string): string {
        const base64 = der.toString("base64");
        const lines: string[] = [];
        lines.push(`-----BEGIN ${type}-----`);

        // Split base64 into 64-character lines (standard PEM format)
        const PEM_LINE_LENGTH = 64;
        for (let i = 0; i < base64.length; i += PEM_LINE_LENGTH) {
            lines.push(base64.substring(i, i + PEM_LINE_LENGTH));
        }

        lines.push(`-----END ${type}-----`);
        return lines.join("\n");
    }

    /**
     * Connect the socket using either native TLS pipe (for non-exportable) or Node.js TLS (for exportable)
     */
    private async connectWithBestMethod(socket: Socket, options: any, callback?: (err: Error | null, socket?: Socket) => void) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { keyring } = require("@zowe/secrets-for-zowe-sdk");

            let isExportable = true;
            let privateKeyDer: Buffer | null = null;

            // Windows currently doesn't support exporting CNG keys cleanly via the secrets SDK
            if (process.platform === "win32") {
                isExportable = false;
            } else {
                try {
                    privateKeyDer = await keyring.getPrivateKey(this.cliHome, this.certAccount);
                    if (!privateKeyDer) {
                        isExportable = false;
                    }
                } catch (err: any) {
                    if (err.message && err.message.includes("non-exportable")) {
                        isExportable = false;
                    } else {
                        // Key not found or other error, let it propagate
                        throw err;
                    }
                }
            }

            if (isExportable && privateKeyDer) {
                // EXPORTABLE KEY PATH: Use standard Node.js TLS (less invasive)
                socket.connect(options.port, options.host, async () => {
                    try {
                        const certDerBuffer = await keyring.getCertificate(this.cliHome, this.certAccount);
                        if (!certDerBuffer) {
                            throw new Error(`Certificate account '${this.certAccount}' not found in keychain.`);
                        }

                        const certPem = this.derToPem(certDerBuffer, "CERTIFICATE");
                        const privateKeyPem = this.derToPem(privateKeyDer!, "PRIVATE KEY");

                        const tlsOptions: tls.ConnectionOptions = {
                            socket,
                            cert: certPem,
                            key: privateKeyPem,
                            servername: options.servername || options.host,
                            rejectUnauthorized: options.rejectUnauthorized ?? true,
                            ca: options.ca,
                        };

                        const tlsSocket = tls.connect(tlsOptions, () => {
                            if (callback) {
                                callback(null, tlsSocket);
                            }
                        });

                        tlsSocket.on("error", (err) => {
                            if (callback) {
                                callback(err);
                            }
                        });

                    } catch (err) {
                        if (callback) {
                            callback(err as Error);
                        }
                    }
                });

                socket.on("error", (err) => {
                    if (callback) {
                        callback(err);
                    }
                });
            } else {
                // NON-EXPORTABLE KEY PATH: Use the native TLS pipe
                const rejectUnauthorized = options.rejectUnauthorized ?? true;
                const host = options.servername || options.host || "localhost";
                const port = options.port || 443;

                if (typeof keyring.createTlsPipe !== "function") {
                    throw new Error("createTlsPipe is not supported by the current version of @zowe/secrets-for-zowe-sdk. Please rebuild the native bindings.");
                }

                const localPort = await keyring.createTlsPipe(host, port, this.certAccount, rejectUnauthorized);

                socket.connect(localPort, "127.0.0.1", () => {
                    // Trick Node.js into thinking this is a secure TLS socket
                    // so it immediately starts writing cleartext HTTP headers to the local pipe
                    (socket as any).encrypted = true;
                    (socket as any).authorized = true;
                    (socket as any).alpnProtocol = false;
                    (socket as any).getPeerCertificate = () => ({});

                    // Emulate the 'secureConnect' event which https.request waits for
                    process.nextTick(() => {
                        socket.emit("secureConnect");
                        if (callback) {
                            callback(null, socket);
                        }
                    });
                });

                socket.on("error", (err) => {
                    if (callback) {
                        callback(err);
                    }
                });
            }
        } catch (err) {
            if (callback) {
                callback(err as Error);
            } else {
                socket.emit("error", err);
            }
        }
    }
}
