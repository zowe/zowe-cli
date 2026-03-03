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

export interface IMacOSNativeHttpsResponse {
    statusCode: number;
    headers?: http.OutgoingHttpHeaders;
    body?: string | Buffer;
}

export interface IMacOSNativeHttpsRequest {
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

export class MacOSNativeHttpsClient {
    private static readonly ENV_FLAG = "ZOWE_MACOS_NATIVE_HTTPS";

    public static isEnabled(session: ISession): boolean {
        return process.platform === "darwin"
            && session?.certAccount != null
            && (this.isFlagEnabled() || (session as any)._useNativeHttpsForNonExportable === true);
    }

    public static async request(options: IHTTPSOptions, session: ISession, writeData?: string | Buffer): Promise<IMacOSNativeHttpsResponse> {
        const nativeHttpsRequest = this.loadNativeRequestFn();

        if (session?.certAccount == null) {
            throw new ImperativeError({
                msg: "macOS native HTTPS client requires a certAccount in the session."
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

        const request: IMacOSNativeHttpsRequest = {
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
     * Check if a certificate's private key is exportable from the macOS Keychain.
     * @param certAccount - The account/label name for the certificate
     * @param cliHome - The CLI home directory (used as service name)
     * @returns Promise<boolean> - true if exportable, false if non-exportable
     */
    public static async isKeyExportable(certAccount: string, cliHome: string): Promise<boolean> {
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
        const value = process.env[this.ENV_FLAG];
        return value === "1" || value?.toLowerCase() === "true";
    }

    private static loadNativeRequestFn(): (request: IMacOSNativeHttpsRequest) => Promise<IMacOSNativeHttpsResponse> {
        let nativeHttpsRequest: any;

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const secretsSdk = require("@zowe/secrets-for-zowe-sdk");
            nativeHttpsRequest = secretsSdk?.nativeHttpsRequest ?? secretsSdk?.keyring?.nativeHttpsRequest;
        } catch (err) {
            throw new ImperativeError({
                msg: "macOS native HTTPS client is not available (failed to load secrets SDK).",
                causeErrors: err,
                additionalDetails: err?.message,
            });
        }

        if (typeof nativeHttpsRequest !== "function") {
            throw new ImperativeError({
                msg: "macOS native HTTPS client is not available. The native request function was not found.",
                additionalDetails: "Ensure the secrets SDK exports nativeHttpsRequest and rebuild native binaries.",
            });
        }

        return nativeHttpsRequest;
    }
}
