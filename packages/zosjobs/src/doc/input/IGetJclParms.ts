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

import { ICommonJobParms } from "./ICommonJobParms";

/**
 * Interface for get JCL APIs
 * @export
 * @interface IGetJclParms
 */
export interface IGetJclParms extends ICommonJobParms {
    /**
     * If you specify true for this field, the file will be downloaded in binary mode
     * @type {boolean}
     * @memberof IGetJclParms
     */
    binary?: boolean;

    /**
     * If you specify true for this field, the file will be downloaded in record mode
     * @type {boolean}
     * @memberof IGetJclParms
     */
    record?: boolean;

    /**
     * The codepage to use for translation from EBCDIC
     * @type {string}
     * @memberof IGetJclParms
     */
    encoding?: string;

    /**
     * Maximum number of bytes of the JCL response that may be held in memory. Must be a positive safe integer.
     * Default: 64 MiB (RestConstants.DEFAULT_MAX_BUFFERED_RESPONSE_BYTES in @zowe/imperative)
     * @type {number}
     * @memberof IGetJclParms
     */
    maxBufferedResponseBytes?: number;

    /**
     * Maximum number of bytes that decompressing the JCL response may produce. Must be a positive safe integer.
     * Default: 64 MiB (RestConstants.DEFAULT_MAX_BUFFERED_DECOMPRESSED_RESPONSE_BYTES in @zowe/imperative)
     * @type {number}
     * @memberof IGetJclParms
     */
    maxDecompressedResponseBytes?: number;
}
