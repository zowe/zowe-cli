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

import { IHeaderContent } from "./doc/IHeaderContent";

/**
 * Class to contain default z/OSMF headers
 * @export
 * @class ZosmfHeaders
 */
export class ZosmfHeaders {

    /**
     * lrecl header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_LRECL = "X-IBM-Intrdr-Lrecl";


    /**
     * recfm header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_RECFM = "X-IBM-Intrdr-Recfm";

    /**
     * job class header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_CLASS_A: IHeaderContent = { "X-IBM-Intrdr-Class": "A" };

    /**
     * fixed recfm header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_RECFM_F: IHeaderContent = { "X-IBM-Intrdr-Recfm": "F" };

    /**
     * 80 lrecl header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_LRECL_80: IHeaderContent = { "X-IBM-Intrdr-Lrecl": "80" };

    /**
     * 256 lrecl header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_LRECL_256: IHeaderContent = { "X-IBM-Intrdr-Lrecl": "256" };

    /**
     * text type header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_INTRDR_MODE_TEXT: IHeaderContent = { "X-IBM-Intrdr-Mode": "TEXT" };

    /**
     * n/a header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_NOTIFICATION_URL: IHeaderContent = { "X-IBM-Notification-URL": "" };

    /**
     * base header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_ATTRIBUTES_BASE: IHeaderContent = { "X-IBM-Attributes": "base" };

    /**
     * If you use this header, delete job API will be asynchronous.
     * This is the default setting, so using this header is not really necessary unless you want to be explicit.
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_JOB_MODIFY_VERSION_1: IHeaderContent = { "X-IBM-Job-Modify-Version": "1.0" };
    /**
     * If you use this header, delete job API will be synchronous.
     * But using it may cause problems for some users depending on their maintenance level and configuration.
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_JOB_MODIFY_VERSION_2: IHeaderContent = { "X-IBM-Job-Modify-Version": "2.0" };

    /**
     * security header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_CSRF_ZOSMF_HEADER: object = { "X-CSRF-ZOSMF-HEADER": true }; // "the value does not matter"

    /**
     * binary transfer header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_BINARY: IHeaderContent = { "X-IBM-Data-Type": "binary" };

    /**
     * binary by record header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_BINARY_BY_RECORD: IHeaderContent = { "X-IBM-Data-Type": "record" };

    /**
     * text transfer header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_TEXT: IHeaderContent = { "X-IBM-Data-Type": "text" };

    /**
     * encoding value for text headers
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_TEXT_ENCODING: string = ";fileEncoding=";

    /**
     * octet stream header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly OCTET_STREAM: IHeaderContent = { "Content-Type": "application/octet-stream" };

    /**
     * plain text header
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly TEXT_PLAIN: IHeaderContent = { "Content-Type": "text/plain" };

    /**
     * This header value specifies the maximum number of items to return.
     * To request that all items be returned, set this header to 0. If you omit this header, or specify an incorrect value,
     * up to 1000 items are returned by default.
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_MAX_ITEMS: IHeaderContent = { "X-IBM-Max-Items": "0" };

    /**
     * data set migrated recall headers
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_MIGRATED_RECALL_WAIT: IHeaderContent = { "X-IBM-Migrated-Recall": "wait" };
    public static readonly X_IBM_MIGRATED_RECALL_NO_WAIT: IHeaderContent = { "X-IBM-Migrated-Recall": "nowait" };
    public static readonly X_IBM_MIGRATED_RECALL_ERROR: IHeaderContent = { "X-IBM-Migrated-Recall": "error" };

    /**
     * Header to check ETag on read
     * Request returns HTTP 304 if not modified
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly IF_NONE_MATCH = "If-None-Match";

    /**
     * Header to check ETag on write
     * Request returns HTTP 412 if not matched
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly IF_MATCH = "If-Match";

    /**
     * Header to force return of ETag in response regardless of file size
     * By default Etag is returned only for files smaller than a system determined value (which is at least 8mb)
     * @static
     * @memberof ZosmfHeaders
     */
    public static readonly X_IBM_RETURN_ETAG: IHeaderContent = {"X-IBM-Return-Etag": "true"};
}
