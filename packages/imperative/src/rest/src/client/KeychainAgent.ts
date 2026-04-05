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
import * as tls from "tls";

/**
 * Custom HTTPS Agent that supports non-exportable private keys from macOS Keychain and Windows Certificate Store.
 * For exportable keys (macOS), Node.js TLS is used directly with the exported key material.
 * For non-exportable keys (Windows CNG, or macOS Secure Enclave), TLS is delegated to Rust via a local TCP pipe.
 *
 * Follows the same "pendingSocket" pattern as agent-base: createSocket() builds the socket
 * asynchronously, stashes it, then lets super.createSocket() call createConnection() synchronously
 * to retrieve it. This ensures the socket is always registered in the pool correctly and that
 * 'secureConnect' listeners are attached before the event fires.
 */
export class KeychainAgent extends https.Agent {
    private certAccount: string;
    private cliHome: string;
    private pendingSocket: net.Socket | tls.TLSSocket | null = null;

    /**
     * Creates a new KeychainAgent
     * @param certAccount - The account/label name for the identity in the keychain
     * @param cliHome - The CLI home directory used as the service name for keyring lookups
     * @param options - Additional HTTPS agent options
     */
    constructor(certAccount: string, cliHome: string, options?: https.AgentOptions) {
        super({
            ...options,
            rejectUnauthorized: options?.rejectUnauthorized ?? true
        });
        this.certAccount = certAccount;
        this.cliHome = cliHome;
    }

    /**
     * Override createSocket (not createConnection) to support async TLS setup.
     * Builds the socket asynchronously, stashes it in pendingSocket, then delegates
     * to super.createSocket() which calls createConnection() synchronously to pick it up.
     * This matches the pattern used by the agent-base package.
     */
    public createSocket(req: http.ClientRequest, options: any, cb: (err: Error | null, socket?: any) => void): void {
        this.buildSocket(options)
            .then((socket) => {
                this.pendingSocket = socket;
                // createSocket lives on http.Agent but is not in @types/node's typings
                (http.Agent.prototype as any).createSocket.call(this, req, options, cb);
            })
            .catch(cb);
    }

    /**
     * Return the pre-built socket stashed by createSocket.
     * super.createSocket() calls this synchronously, so pendingSocket is always set.
     */
    public createConnection(_options: any, _callback?: (err: Error | null, socket?: net.Socket) => void): net.Socket {
        const socket = this.pendingSocket as net.Socket;
        this.pendingSocket = null;
        if (!socket) {
            throw new Error("KeychainAgent: createConnection called without a pending socket");
        }
        return socket;
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
     * Determine whether the private key is exportable and route to the appropriate socket builder.
     * Windows CNG keys are always non-exportable by this agent (delegated to Rust).
     * macOS Keychain keys are exported if possible, otherwise delegated to Rust.
     */
    private async buildSocket(options: any): Promise<net.Socket | tls.TLSSocket> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { keyring } = require("@zowe/secrets-for-zowe-sdk");

        let isExportable = false;
        let privateKeyDer: Buffer | null = null;

        if (process.platform !== "win32") {
            try {
                privateKeyDer = await keyring.getPrivateKey(this.cliHome, this.certAccount);
                isExportable = privateKeyDer != null;
            } catch (err: any) {
                if (!(err.message?.includes("non-exportable"))) {
                    throw err;
                }
            }
        }
        // Windows: CNG private keys cannot be exported; always use the Rust TLS pipe

        if (isExportable && privateKeyDer) {
            return this.buildExportableTlsSocket(options, privateKeyDer, keyring);
        } else {
            return this.buildPipeSocket(options, keyring);
        }
    }

    /**
     * Exportable key path (macOS): fetch cert + key from keychain, let Node perform TLS.
     *
     * Returns a tls.TLSSocket that is *connecting but not yet connected*. This is critical:
     * super.createSocket() → createConnection() → oncreate() → req.onSocket() all run
     * synchronously, attaching the 'secureConnect' listener before it fires. The socket
     * then completes the handshake asynchronously and emits 'secureConnect' naturally.
     */
    private async buildExportableTlsSocket(options: any, privateKeyDer: Buffer, keyring: any): Promise<tls.TLSSocket> {
        const certDerBuffer = await keyring.getCertificate(this.cliHome, this.certAccount);
        if (!certDerBuffer) {
            throw new Error(`Certificate '${this.certAccount}' not found in keychain.`);
        }
        const certPem = this.derToPem(certDerBuffer, "CERTIFICATE");
        const privateKeyPem = this.derToPem(privateKeyDer, "PRIVATE KEY");

        // tls.connect() returns a TLSSocket immediately while the TCP+TLS handshake
        // proceeds asynchronously. We resolve with it right away so the HTTP machinery
        // can attach its 'secureConnect' listener before the event fires.
        const tlsSocket = tls.connect({
            host: options.host,
            port: options.port,
            cert: certPem,
            key: privateKeyPem,
            servername: options.servername || options.host,
            rejectUnauthorized: options.rejectUnauthorized ?? true,
            ca: options.ca,
        });

        return new Promise<tls.TLSSocket>((resolve, reject) => {
            tlsSocket.once("error", reject);
            resolve(tlsSocket);
        });
    }

    /**
     * Non-exportable key path (Windows CNG / macOS Secure Enclave):
     * delegate TLS entirely to Rust via a local TCP pipe.
     *
     * Rust establishes the TLS session using the OS certificate store (Schannel on Windows,
     * Secure Transport on macOS), then proxies decrypted HTTP traffic over a local TCP socket.
     * We duck-type the net.Socket as a TLS socket so Node's https machinery writes to it directly.
     *
     * The socket is fully connected before being returned. 'secureConnect' is emitted in
     * the next tick — after super.createSocket() has run synchronously and req.onSocket()
     * has attached its listener — so the event is never missed.
     */
    private async buildPipeSocket(options: any, keyring: any): Promise<net.Socket> {
        if (typeof keyring.createTlsPipe !== "function") {
            throw new Error(
                "createTlsPipe is not supported by the current version of @zowe/secrets-for-zowe-sdk. " +
                "Please rebuild the native bindings."
            );
        }

        const host = options.servername || options.host || "localhost";
        const port = options.port || 443;
        const rejectUnauthorized = options.rejectUnauthorized ?? true;

        const localPort: number = await keyring.createTlsPipe(host, port, this.certAccount, rejectUnauthorized);

        return new Promise<net.Socket>((resolve, reject) => {
            const socket = new net.Socket();

            // Duck-type as a TLS socket before connecting so the property is visible
            // the moment Node's HTTP machinery receives it from createConnection().
            (socket as any).encrypted = true;
            (socket as any).authorized = true;
            (socket as any).alpnProtocol = false;
            (socket as any).getPeerCertificate = () => ({});

            socket.connect(localPort, "127.0.0.1", () => {
                // Resolve the promise. The call chain:
                //   buildSocket resolves → super.createSocket() [sync] → createConnection() [sync]
                //   → oncreate(null, socket) [sync] → cb(null, socket) [sync]
                //   → req.onSocket(socket) [sync] attaches 'secureConnect' listener
                //   → nextTick fires → 'secureConnect' is caught by the listener
                resolve(socket);
                process.nextTick(() => socket.emit("secureConnect"));
            });

            socket.once("error", reject);
        });
    }
}

