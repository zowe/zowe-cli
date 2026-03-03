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
import * as tls from "tls";
import { Socket } from "net";

/**
 * Custom HTTPS Agent that supports non-exportable private keys from macOS Keychain.
 * This agent creates TLS connections using certificate identities stored in the system keychain.
 */
export class KeychainAgent extends https.Agent {
    private certAccount: string;
    private cliHome: string;

    /**
     * Creates a new KeychainAgent
     * @param certAccount - The account/label name for the identity in the keychain
     * @param cliHome - The CLI home directory (used as service name)
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
        // Create a plain TCP socket first
        const socket = new Socket();

        // Connect to the target host
        socket.connect(options.port, options.host, () => {
            // Once TCP connection is established, upgrade to TLS using keychain identity
            this.upgradeToTLS(socket, options, callback);
        });

        // Handle connection errors
        socket.on("error", (err) => {
            if (callback) {
                callback(err);
            }
        });

        return socket;
    }

    /**
     * Upgrade a plain socket to TLS using the keychain identity
     */
    private async upgradeToTLS(socket: Socket, options: any, callback?: (err: Error | null, socket?: Socket) => void): Promise<void> {
        try {
            // Load the keyring module to access certificate
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { keyring } = require("@zowe/secrets-for-zowe-sdk");

            // Get certificate from keychain
            const certDerBuffer = await keyring.getCertificate(this.cliHome, this.certAccount);

            if (certDerBuffer == null) {
                throw new Error(`Certificate account '${this.certAccount}' not found in keychain.`);
            }

            // Convert DER to PEM format
            const certPem = this.derToPem(certDerBuffer, "CERTIFICATE");

            // Get the private key (must be exportable to reach this code path)
            // Non-exportable keys are automatically handled by MacOSNativeHttpsClient
            let privateKeyPem: string | null = null;

            try {
                const privateKeyDer = await keyring.getPrivateKey(this.cliHome, this.certAccount);
                if (privateKeyDer) {
                    privateKeyPem = this.derToPem(privateKeyDer, "PRIVATE KEY");
                } else {
                    throw new Error(`No private key data returned for certificate account '${this.certAccount}'`);
                }
            } catch (keyErr: any) {
                throw new Error(`Failed to retrieve private key for '${this.certAccount}': ${keyErr.message}`);
            }

            // Create TLS options with the certificate
            const tlsOptions: tls.ConnectionOptions = {
                socket,
                cert: certPem,
                servername: options.servername || options.host,
                rejectUnauthorized: options.rejectUnauthorized,
                ca: options.ca,
            };

            // Set the private key for TLS
            tlsOptions.key = privateKeyPem;

            // Upgrade the socket to TLS
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
}
