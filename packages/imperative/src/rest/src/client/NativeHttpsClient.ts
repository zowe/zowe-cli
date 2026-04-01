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
import { ImperativeError } from "../../../error";
import { ImperativeConfig } from "../../../utilities";
import { IHTTPSOptions } from "./doc/IHTTPSOptions";
import { ISession } from "../session/doc/ISession";

export interface INativeHttpsResponse {
    statusCode: number;
    headers?: http.OutgoingHttpHeaders;
    body?: string | Buffer;
}

export interface INativeHttpsRequest {
    hostname: string;
    port?: number;
    path: string;
    method: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    rejectUnauthorized?: boolean;
    ca?: unknown;
    certAccount: string;
    cliHome: string;
    timeout?: number;
}

export class NativeHttpsClient {
    private static readonly ENV_FLAG_MACOS = "ZOWE_MACOS_NATIVE_HTTPS";
    private static readonly ENV_FLAG_WINDOWS = "ZOWE_WINDOWS_NATIVE_HTTPS";

    /**
     * Check if the Native HTTPS client should be used for the given session.
     * The Native HTTPS client is used when:
     * - Running on macOS or Windows
     * - A certificate account is specified in the session
     * - Either the environment flag is enabled OR the certificate has a non-exportable private key
     *
     * @param session - The session to check
     * @returns true if Native HTTPS client should be used, false otherwise
     */
    public static isEnabled(session: ISession): boolean {
        return (process.platform === "darwin" || process.platform === "win32")
            && session?.certAccount != null
            && (this.isFlagEnabled() || (session as any)._useNativeHttpsForNonExportable === true);
    }

    /**
     * Make an HTTPS request using the native client with certificate authentication.
     *
     * Note: This method supports streaming by buffering the entire request/response in memory.
     * For request streaming, the entire stream is read into memory before making the request.
     * For response streaming, the response body is returned as a complete buffer.
     *
     * @param options - HTTP request options
     * @param session - Session containing certificate account information
     * @param writeData - Optional request body data
     * @returns Promise resolving to the HTTP response
     */
    public static async request(options: IHTTPSOptions, session: ISession, writeData?: string | Buffer): Promise<INativeHttpsResponse> {
        const nativeHttpsRequest = this.loadNativeRequestFn();
        const platformName = process.platform === "darwin" ? "macOS" : "Windows";

        if (session?.certAccount == null) {
            throw new ImperativeError({
                msg: `${platformName} native HTTPS client requires a certAccount in the session.`
            });
        }

        const port = options.port != null && !isNaN(Number(options.port))
            ? Number(options.port)
            : undefined;

        // Convert headers to string-only format (native code expects string values)
        const normalizedHeaders: Record<string, string> = {};
        if (options.headers != null) {
            for (const [key, value] of Object.entries(options.headers)) {
                if (Array.isArray(value)) {
                    normalizedHeaders[key] = value.join(", ");
                } else if (value != null) {
                    normalizedHeaders[key] = String(value);
                }
            }
        }

        const request: INativeHttpsRequest = {
            hostname: options.hostname,
            port,
            path: options.path,
            method: options.method,
            headers: normalizedHeaders,
            body: writeData,
            rejectUnauthorized: options.rejectUnauthorized,
            ca: (options as any).ca,
            certAccount: session.certAccount,
            cliHome: ImperativeConfig.instance.cliHome,
            timeout: session.requestCompletionTimeout ?? session.socketConnectTimeout,
        };

        return nativeHttpsRequest(request);
    }

    /**
     * Check if a certificate's private key is exportable from the certificate store.
     * @param certAccount - The account/label name for the certificate
     * @param cliHome - The CLI home directory (used as service name)
     * @returns Promise<boolean> - true if exportable, false if non-exportable
     */
    public static async isKeyExportable(certAccount: string, cliHome: string): Promise<boolean> {
        // Windows does not currently support checking key exportability
        // All Windows keys are treated as non-exportable and use the native HTTPS client
        if (process.platform === "win32") {
            return false;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const secretsSdk = require("@zowe/secrets-for-zowe-sdk");
            const keyring = secretsSdk?.keyring;

            if (!keyring || typeof keyring.getPrivateKey !== "function") {
                // If we can't check, assume it's exportable (will fail later if not)
                return true;
            }

            try {
                await keyring.getPrivateKey(cliHome, certAccount);
                return true; // Key is exportable
            } catch (err: any) {
                if (err.message && err.message.includes("non-exportable")) {
                    return false; // Key is non-exportable
                }
                // For other errors, assume exportable (will fail later with proper error)
                return true;
            }
        } catch (err) {
            // If secrets SDK is not available, assume exportable
            return true;
        }
    }

    private static isFlagEnabled(): boolean {
        const envFlag = process.platform === "win32" ? this.ENV_FLAG_WINDOWS : this.ENV_FLAG_MACOS;
        const value = process.env[envFlag];
        return value === "1" || value?.toLowerCase() === "true";
    }

    private static loadNativeRequestFn(): (request: INativeHttpsRequest) => Promise<INativeHttpsResponse> {
        let nativeHttpsRequest: any;
        const platformName = process.platform === "darwin" ? "macOS" : "Windows";

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const secretsSdk = require("@zowe/secrets-for-zowe-sdk");
            nativeHttpsRequest = secretsSdk?.nativeHttpsRequest ?? secretsSdk?.keyring?.nativeHttpsRequest;
        } catch (err) {
            throw new ImperativeError({
                msg: `${platformName} native HTTPS client is not available (failed to load secrets SDK).`,
                causeErrors: err,
                additionalDetails: err?.message,
            });
        }

        if (typeof nativeHttpsRequest !== "function") {
            throw new ImperativeError({
                msg: `${platformName} native HTTPS client is not available. The native request function was not found.`,
                additionalDetails: "Ensure the secrets SDK exports nativeHttpsRequest and rebuild native binaries.",
            });
        }

        return nativeHttpsRequest;
    }
}
