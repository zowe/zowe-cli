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
     * This function provides a limited encoding for URI paths, which is
     * required to avoid failures in existing USS REST operations.
     *
     * By consolidating URI encoding for USS files in this function, any actions needed to
     * react to future URI encoding changes can be implemented in one place.
     *
     * @param {string} ussUriPath - the URI path to encode
     */
    public static encUriPathForUss(ussUriPath: string) {
        let encodedUriPath = encodeURI(path.posix.normalize(ussUriPath));

        // JavaScript's encodeURI does not encode ? or +
        // Both must be encoded. Without encoding, these characters result in
        // space in a file name (from +) or a truncated filename (from ?).
        encodedUriPath = encodedUriPath.replaceAll("?", "%3F");
        encodedUriPath = encodedUriPath.replaceAll("+", "%2B");

        // JavaScript's encodeURI does not encode #
        // zosmf works with # encoded or unencoded, but APIML fails with
        // a 400 error unless # is encoded.
        encodedUriPath = encodedUriPath.replaceAll("#", "%23");
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
