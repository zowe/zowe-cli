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

import * as path from "node:path";

import { AbstractSession } from "../session/AbstractSession";
import { ImperativeError } from "../../../error";
import { Logger } from "../../../logger";

/**
 * Common IO utilities
 */
export class EncodeUri {
    /**
     * URI-Encode a z/OS resource (like datasets, volser, jobname, and jobid)
     * for use in the path component of a URI.
     *
     * Perform the minimum URI encoding for documented z/OS resource special characters
     * (see https://www.ibm.com/docs/en/zos-basic-skills?topic=set-how-are-data-sets-named)
     * to be successfully processed by z/OSMF and APIML.
     *
     * This function exists to facilitate any special encoding that has to be
     * performed in the future.
     *
     * @param {string} session - The session used to connect to the server.
     * @param {string} zosUriPath - the URI path to encode
     */
    public static encUriPathForZos(session: AbstractSession, zosUriPath: string) {
        if (EncodeUri.shouldEncodeForApiml(session)) {
            // zosmf works with # encoded or unencoded, but
            // APIML fails with a 400 error unless # is encoded.
            Logger.getImperativeLogger().info("Encoding '#' in a z/OS URI path for API-ML");
            return zosUriPath.replaceAll("#", "%23");
        }
        return zosUriPath;
    }

    /**
     * URI-Encode a USS file name for use in the path component of a URI.
     *
     * Many of the documented USS filename special characters
     * (see https://www.ibm.com/docs/en/zos/3.1.0?topic=pages-zos-data-set-unix-file-naming-conventions)
     * result in the error "HTTP(S) error 500 = Internal Server Error", unless they are encoded.
     *
     * A future external change related to URI encoding is expected to reject
     * URIs containing encoded characters such as %2F (the forward slash character '/').
     *
     * This function provides a limited encoding for URI paths, which is still
     * required to avoid failures in existing USS REST operations.
     *
     * By consolidating URI encoding for USS files in this function, any actions needed to
     * react to future URI encoding changes can be implemented in one place.
     *
     * @param {string} session - The session used to connect to the server.
     * @param {string} ussUriPath - the URI path to encode
     */
    public static encUriPathForUss(session: AbstractSession, ussUriPath: string) {
        let encodedUriPath = "";
        const encodeForApiml: boolean = EncodeUri.shouldEncodeForApiml(session);

        // normalize will eliminate // and /../
        for (const nextChar of path.posix.normalize(ussUriPath)) {
            switch(nextChar) {
                case "\\":
                    // Both encoded and unencoded backslash fail in REST requests
                    throw new ImperativeError({
                        msg: `The supplied USS path = '${ussUriPath}' contains a backslash \\ character. ` +
                            `When a backslash is present, both z/OSMF and API-ML servers fail with an ` +
                            `HTTP 400 or 500 error code, or the backslash is ignored. Therefore, `+
                            `this request was not sent.`
                    });

                case '"':
                    // Both encoded and unencoded double-quote fail in REST requests
                    throw new ImperativeError({
                        msg: `The supplied USS path = '${ussUriPath}' contains a double-quote " character. ` +
                            `When a double-quote is present, both z/OSMF and API-ML servers fail with an ` +
                            `HTTP 400 or 500 error code. Therefore, this request was not sent.`
                    });

                case " ":
                    // Without encoding, a space fails in both apiml and zosmf with the following error
                    // from node:_http_client. 'Request path contains unescaped characters'
                    encodedUriPath += "%20";
                    break;
                case "%":
                    // Without encoding, a % fails in both apiml and zosmf with an HTTP 400 error.
                    encodedUriPath += "%25";
                    break;
                case "+":
                    // Without encoding, a + will be replaced with a space in both apiml and zosmf
                    encodedUriPath += "%2B";
                    break;
                case "?":
                    // Without encoding, a ? truncates a file name at the location of the ? in both apiml and zosmf
                    encodedUriPath += "%3F";
                    break;
                default:
                    if (encodeForApiml) {
                        encodedUriPath += EncodeUri.encCharOnlyForApiml(nextChar);
                    } else {
                        encodedUriPath += nextChar;
                    }
                    break;
            }
        }
        return encodedUriPath;
    }

    /**
     * URI-Encode a USS filename for use in a URI query string.
     *
     * Use the higher-level of encoding permitted in URI query strings.
     *
     * @param {string} ussUriPath - a USS file name to encode for a URI query string
     */
    public static encUriQueryForUss(ussFileNmForQuery: string) {
        return encodeURIComponent(path.posix.normalize(ussFileNmForQuery));
    }

    /**
     * Encode a character for a USS URI path when connecting to API-ML.
     * API-ML fails with an HTTP 400 error unless these characters are encoded.
     * None of these characters will be encoded for z/OSMF.
     * This function relies on its caller to encode characters that must be
     * encoded for both z/OSMF and API-ML (like %), and to not pass those
     * characters to this function.
     *
     * @param {string} charToEncode - The character to encode.
     *
     * @returns {string} - The value of charToEncode for most characters.
     *                     The URI-encoded value of charToEncode where needed.
     */
    private static encCharOnlyForApiml(charToEncode: string): string {
        let encodedChar = charToEncode;
        switch (charToEncode) {
            case "#":
                encodedChar = "%23";
                break;
            case ";":
                encodedChar = "%3B";
                break;
            case "<":
                encodedChar = "%3C";
                break;
            case ">":
                encodedChar = "%3E";
                break;
            case "[":
                encodedChar = "%5B";
                break;
            case "]":
                encodedChar = "%5D";
                break;
            case "^":
                encodedChar = "%5E";
                break;
            case "{":
                encodedChar = "%7B";
                break;
            case "|":
                encodedChar = "%7C";
                break;
            case "}":
                encodedChar = "%7D";
                break;
        }
        if (encodedChar[0] === "%") {
            Logger.getImperativeLogger().info(`Encoded the '${charToEncode}' character for API-ML`);
        }
        return encodedChar;
    }

    /**
     * Determine if we should encode a URI path for APIML or not.
     *
     * @param {string} session - The session used to connect to the server.
     *
     * @returns {boolean} - True if we must encode for APIML. False otherwise.
     */
    private static shouldEncodeForApiml(session: AbstractSession): boolean {
        return typeof session?.isUsingApiml === "function" && session.isUsingApiml();
    }
}
