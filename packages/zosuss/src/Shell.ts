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

import { Logger, ImperativeError } from "@zowe/imperative";
import { ClientChannel, Client } from "ssh2";
import { createHash } from "crypto";
import { SshSession } from "./SshSession";
import { ZosUssMessages } from "./constants/ZosUss.messages";

/**
 * Tracks state about a single connection attempt that needs to be shared between the host key
 * verifier (which runs during the handshake) and the connection error handler.
 */
interface IConnectionState {
    /** Set to true when the connection was aborted because the server's host key was not trusted. */
    hostKeyRejected: boolean;
    /** Set to true when the rejected host key differed from a previously pinned key. */
    hostKeyChanged: boolean;
}

export class Shell {
    public static readonly startCmdFlag = "@@START OF COMMAND@@";

    public static readonly connRefusedFlag = "ECONNREFUSED";

    public static readonly expiredPasswordFlag = "FOTS1668";

    public static executeSsh(session: SshSession,
        command: string,
        stdoutHandler: (data: string) => void): Promise<any> {
        const authsAllowed = ["none"];
        let hasAuthFailed = false;
        const connState: IConnectionState = { hostKeyRejected: false, hostKeyChanged: false };
        const pinnedAlgorithm = Shell.getPinnedHostKeyAlgorithm(session);
        const promise = new Promise<any>((resolve, reject) => {
            const conn = new Client();

            // These are needed for authenticationHandler
            // The order is critical as this is the order of authentication that will be used.
            if (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") {
                authsAllowed.push("publickey");
            }
            if (session.ISshSession.password != null && session.ISshSession.password !== "undefined") {
                authsAllowed.push("password");
            }
            conn.on("ready", () => {
                conn.shell((err: any, stream: ClientChannel) => {
                    if (err) { throw err; }
                    let dataBuffer = "";
                    let dataToPrint = "";
                    let isUserCommand = false;
                    let rc: number;

                    // isolate the command
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    const cmd = command.slice(0, 75);

                    stream.on("exit", (exitcode: number) => {
                        Logger.getAppLogger().debug(`Return Code: ${exitcode}`);
                        if (dataBuffer.trim().length > 1) {
                            // normally the last line is "\r\n$ " and we don't care about it
                            // but we need to handle the case of an incomplete line at the end
                            // which can happen when commands terminate abruptly
                            stdoutHandler(dataBuffer.slice(0, dataBuffer.lastIndexOf("$")));
                        }
                        rc = exitcode;
                    });
                    stream.on("close", () => {
                        Logger.getAppLogger().debug("SSH connection closed");
                        if (!hasAuthFailed) stdoutHandler("\n");
                        conn.end();
                        resolve(rc);
                    });
                    stream.on("data", (data: Buffer | string) => {
                        Logger.getAppLogger().debug("\n[Received data begin]" + data + "[Received data end]\n");
                        // We do not know if password is expired until now.
                        // If it is, emit an error and shut down the stream.
                        if (dataBuffer.length === 0 && data.indexOf(this.expiredPasswordFlag) === 0) {
                            hasAuthFailed = true;
                            conn.emit("error", new Error(data.toString()));
                            stream.removeAllListeners("data");
                            stream.close();
                            return;
                        }
                        dataBuffer += data;
                        if (dataBuffer.includes("\r")) {
                            // when data is not received with complete lines,
                            // slice the last incomplete line and put it back to dataBuffer until it gets the complete line,
                            // rather than print it out right away
                            dataToPrint = dataBuffer.slice(0, dataBuffer.lastIndexOf("\r"));
                            dataBuffer = dataBuffer.slice(dataBuffer.lastIndexOf("\r"));

                            // check startCmdFlag: start printing out data
                            if (dataToPrint.match(new RegExp(`\n${this.startCmdFlag}`)) ||
                                dataToPrint.match(new RegExp("\\$ " + this.startCmdFlag))) {
                                dataToPrint = dataToPrint.slice(dataToPrint.indexOf(this.startCmdFlag) + this.startCmdFlag.length);
                                isUserCommand = true;
                            }

                            if (isUserCommand && dataToPrint.match(/\$ exit/)) {
                                // if exit found, print out stuff before exit, then stop printing out.
                                dataToPrint = dataToPrint.slice(0, dataToPrint.indexOf("$ exit"));
                                stdoutHandler(dataToPrint);
                                dataToPrint = "";
                                isUserCommand = false;
                            }
                            else if (isUserCommand && dataToPrint.length != 0) {
                                if (!dataToPrint.startsWith('\r\n$ '+cmd) && !dataToPrint.startsWith('\r<')){
                                    //only prints command output
                                    stdoutHandler(dataToPrint);
                                    dataToPrint = "";
                                }
                            }
                        }
                    });

                    // exit multiple times in case of nested shells
                    stream.write(`export PS1='$ '\necho ${this.startCmdFlag}\n${command}\n` +
                    `exit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\nexit $?\n`);
                    stream.end();
                });
            });
            conn.on("error", (err: Error) => {
                if (connState.hostKeyRejected) {
                    reject(new ImperativeError({
                        msg: connState.hostKeyChanged ?
                            ZosUssMessages.hostKeyChanged.message :
                            ZosUssMessages.hostKeyVerificationFailed.message
                    }));
                } else if (err.message.startsWith(this.expiredPasswordFlag)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.expiredPassword.message
                    }));
                } else if (err.message.includes(ZosUssMessages.allAuthMethodsFailed.message)) {
                    hasAuthFailed = true;
                    reject(new ImperativeError({
                        msg: ZosUssMessages.allAuthMethodsFailed.message
                    }));
                }
                // throw error only when authentication didn't fail.
                else if (!hasAuthFailed && err.message.includes(ZosUssMessages.handshakeTimeout.message)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.handshakeTimeout.message
                    }));
                } else if (err.message.includes(this.connRefusedFlag)) {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.connectionRefused.message + ":\n" + err.message
                    }));
                } else {
                    reject(new ImperativeError({
                        msg: ZosUssMessages.unexpected.message + ":\n" + err.message
                    }));
                }
            });
            conn.connect({
                host: session.ISshSession.hostname,
                port: session.ISshSession.port,
                username: session.ISshSession.user,
                password: session.ISshSession.password,
                privateKey: (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") ?
                    require("fs").readFileSync(session.ISshSession.privateKey) : "",
                passphrase: session.ISshSession.keyPassphrase,
                authHandler: this.authenticationHandler(authsAllowed),
                hostVerifier: this.hostVerifier(session, connState),
                // When a host key is pinned, ask the server for that same key type. A server holds one host key
                // per algorithm, and which one it presents is negotiated; without this, a change in negotiation
                // (e.g. an ssh2 upgrade reordering its preferences) would present a different - but still
                // legitimate - key and be misreported as a changed key.
                ...pinnedAlgorithm != null ? { algorithms: { serverHostKey: [pinnedAlgorithm] } } : {},
                readyTimeout: (session.ISshSession.handshakeTimeout != null && session.ISshSession.handshakeTimeout !== undefined) ?
                    session.ISshSession.handshakeTimeout : 0
            } as any);
        });
        return promise;
    }

    /**
     * Build the ssh2 host key verifier callback. Host key verification runs during the SSH handshake,
     * before any credentials are sent, so an untrusted server never receives the user's password.
     *
     * The presented key is trusted when:
     *  - host key verification is disabled (insecure === true), or
     *  - it matches the pinned {@link ISshSession.hostKey}.
     *
     * Otherwise (no pinned key, or the key changed) the decision is delegated to the session's
     * interactive {@link SshSession.hostKeyVerifier} hook if one is set (trust on first use); when no
     * hook is available (e.g. non-interactive SDK usage) the connection is rejected.
     *
     * @param session - the SSH session being connected
     * @param connState - state updated when a key is rejected, so a clear error can be surfaced
     * @returns an ssh2 hostVerifier callback
     */
    private static hostVerifier(session: SshSession, connState: IConnectionState) {
        return (keyBuf: Buffer, callback: (valid: boolean) => void) => {
            // Verification explicitly disabled - accept any key (insecure).
            if (session.ISshSession.insecure === true) {
                callback(true);
                return;
            }

            const presentedKey = keyBuf.toString("base64");
            const pinnedKey = session.ISshSession.hostKey;
            const hasPinnedKey = pinnedKey != null && pinnedKey !== "" && pinnedKey !== "undefined";

            // Pinned key matches the presented key - trusted, no prompt needed.
            if (hasPinnedKey && pinnedKey === presentedKey) {
                callback(true);
                return;
            }

            const changed = hasPinnedKey && pinnedKey !== presentedKey;

            // Key is unknown or has changed - delegate to the interactive hook if the caller provided one.
            if (session.hostKeyVerifier != null) {
                session.hostKeyVerifier({
                    fingerprint: this.getHostKeyFingerprint(keyBuf),
                    key: presentedKey,
                    changed
                }).then((trusted) => {
                    if (!trusted) {
                        connState.hostKeyRejected = true;
                        connState.hostKeyChanged = changed;
                    }
                    callback(trusted === true);
                }).catch(() => {
                    connState.hostKeyRejected = true;
                    connState.hostKeyChanged = changed;
                    callback(false);
                });
                return;
            }

            // No interactive layer available to trust the key - reject.
            connState.hostKeyRejected = true;
            connState.hostKeyChanged = changed;
            callback(false);
        };
    }

    /**
     * Compute the OpenSSH-style SHA256 fingerprint of a host key for display to the user,
     * e.g. "SHA256:Xn5vB...". Matches the format shown by the standard `ssh` client.
     * @param keyBuf - the raw host key blob presented by the server
     * @returns the fingerprint string
     */
    public static getHostKeyFingerprint(keyBuf: Buffer): string {
        const digest = createHash("sha256").update(keyBuf).digest("base64").replace(/=+$/, "");
        return `SHA256:${digest}`;
    }

    /**
     * Extract the algorithm name from an SSH public key blob. The blob is self-describing: it begins with
     * a 4-byte big-endian length followed by the algorithm name, e.g. "ssh-ed25519" or "ssh-rsa".
     * @param keyBuf - the raw host key blob
     * @returns the algorithm name, or undefined if the blob cannot be parsed
     */
    public static getHostKeyAlgorithm(keyBuf: Buffer): string | undefined {
        // Need at least the 4-byte length prefix
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (keyBuf == null || keyBuf.length < 4) {
            return undefined;
        }
        const nameLength = keyBuf.readUInt32BE(0);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (nameLength <= 0 || nameLength > keyBuf.length - 4) {
            return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const algorithm = keyBuf.subarray(4, 4 + nameLength).toString("ascii");
        // Guard against binary junk being interpreted as an algorithm name
        return /^[\w.@-]+$/.test(algorithm) ? algorithm : undefined;
    }

    /**
     * Determine which host key algorithm to request from the server, based on the pinned host key.
     * Returns undefined when verification is disabled, no key is pinned, or the pinned key cannot be
     * parsed - in which case ssh2's default algorithm negotiation applies.
     * @param session - the SSH session being connected
     * @returns the algorithm name to pin, or undefined to use the default negotiation
     */
    private static getPinnedHostKeyAlgorithm(session: SshSession): string | undefined {
        const pinnedKey = session.ISshSession.hostKey;
        if (session.ISshSession.insecure === true || pinnedKey == null ||
            pinnedKey === "" || pinnedKey === "undefined") {
            return undefined;
        }
        try {
            return this.getHostKeyAlgorithm(Buffer.from(pinnedKey, "base64"));
        } catch {
            return undefined;
        }
    }

    public static async executeSshCwd(session: SshSession,
        command: string,
        cwd: string,
        stdoutHandler: (data: string) => void): Promise<any> {
        const cwdCommand = `cd ${cwd} && ${command}`;
        return this.executeSsh(session, cwdCommand, stdoutHandler);
    }

    private static authenticationHandler(authsAllowed: string[]) {
        let authPos = 0;
        return (methodsLeft: string[], partialSuccess: boolean, callback: any) => {
            if (authPos === authsAllowed.length) {
                return false;
            }
            return authsAllowed[authPos++];
        };
    }
}

/**
 * @deprecated Use `Shell.startCmdFlag` instead.
 */
export const startCmdFlag = Shell.startCmdFlag;
