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

import * as path from "path";
import { ImperativeError } from "../../../error";

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
     * @param {string} zosUriPath - the URI path to encode
     */
    public static encUriPathForZos(zosUriPath: string) {
        // zosmf works with # encoded or unencoded, but APIML fails with
        // a 400 error unless # is encoded.
        const encodedUriPath = zosUriPath.replaceAll("#", "%23");
        return encodedUriPath;
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
     * @param {string} ussUriPath - the URI path to encode
     */
    public static encUriPathForUss(ussUriPath: string) {
        if (ussUriPath.includes("\\")) {
            // Both encoded and unencoded backslash fails in REST requests
            throw new ImperativeError({
                msg: `The supplied USS path = '${ussUriPath}' contains a backslash \\ character. ` +
                    `This request will not be processed. In both z/OSMF and API-ML the backslash is either ignored, ` +
                    `or the request fails with an HTTP 400 or 500 error code.`
            });
        }
        if (ussUriPath.includes('"')) {
            // Both encoded and unencoded double-quote fails in REST requests
            throw new ImperativeError({
                msg: `The supplied USS path = '${ussUriPath}' contains a double-quote " character. ` +
                    `This request will not be processed. In both z/OSMF and API-ML the double-quote ` +
                    `fails with an HTTP 400 or 500 error code.`
            });
        }

        let encodedUriPath = ussUriPath;

        // Without encoding, % fails in both apiml and zosmf with an HTTP 400 error.
        // This replacement must come first.
        encodedUriPath = encodedUriPath.replaceAll("%", "%25");

        // Without encoding, space fails in both apiml and zosmf with the following error
        // from node:_http_client. 'Request path contains unescaped characters'
        encodedUriPath = encodedUriPath.replaceAll(" ", "%20");

        // Without encoding, both apiml and zosmf replace + with a space in the file name.
        encodedUriPath = encodedUriPath.replaceAll("+", "%2B");

        // Without encoding, ? both apiml and zosmf truncates a file name at the location of the ?
        encodedUriPath = encodedUriPath.replaceAll("?", "%3F");

        // zosmf works with each of the following characters encoded or unencoded,
        // but APIML fails with an HTTP 400 error unless the character is encoded.
        encodedUriPath = encodedUriPath.replaceAll("#", "%23");
        encodedUriPath = encodedUriPath.replaceAll(";", "%3B");
        encodedUriPath = encodedUriPath.replaceAll("<", "%3C");
        encodedUriPath = encodedUriPath.replaceAll(">", "%3E");
        encodedUriPath = encodedUriPath.replaceAll("[", "%5B");
        encodedUriPath = encodedUriPath.replaceAll("]", "%5D");
        encodedUriPath = encodedUriPath.replaceAll("^", "%5E");
        encodedUriPath = encodedUriPath.replaceAll("{", "%7B");
        encodedUriPath = encodedUriPath.replaceAll("|", "%7C");
        encodedUriPath = encodedUriPath.replaceAll("}", "%7D");

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
}
