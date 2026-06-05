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
     * None of the documented z/OS resource special characters
     * (see https://www.ibm.com/docs/en/zos-basic-skills?topic=set-how-are-data-sets-named)
     * require URI-encoding to be successfully processed by z/OSMF.
     *
     * This function does no encoding today. It exists to facilitate any special
     * encoding that has to be performed in the future.
     *
     * @param {string} zosUriPath - the URI path to encode
     */
    public static encUriPathForZos(zosUriPath: string) {
        // zosmf works with # unencoded, but APIML fails unless it is encoded.
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
     * The APAR described by ICN2210
     * https://broadcom.ent.box.com/file/2218430752021?s=rwxz1xiiissrcz1hsq63vbx7jxsni3ch
     * states that "URLs containing encoded characters such as %2F (the forward slash character '/')
     * will be rejected".
     *
     * If that APAR rejects all encoded characters, it puts REST operations on USS files
     * between a rock and a hard place. This function provides the limited encoding designed
     * for URI paths, which is required to avoid failures in existing USS REST operations.
     *
     * By consolidating URI encoding for USS files in this function, any action needed to
     * react to APAR ICN2210 can be implemented in one place.
     *
     * @param {string} ussUriPath - the URI path to encode
     */
    public static encUriPathForUss(ussUriPath: string) {
        let encodedUriPath = encodeURI(path.posix.normalize(ussUriPath));

        // JavaScript's encodeURI does not encode ? or +
        // Both should be encoded since this function encodes
        // a URI path, not a URI query.
        encodedUriPath = encodedUriPath.replaceAll("?", "%3F");
        encodedUriPath = encodedUriPath.replaceAll("+", "%2B");
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
