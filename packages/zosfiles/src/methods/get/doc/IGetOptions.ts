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

import { IOptions } from "../../../doc/IOptions";

/**
 * This interface defines the options that can be sent to get a data set or USS file function
 * @export
 * @interface IGetOptions
 */
export interface IGetOptions extends IOptions {
    /**
     * Range of records to return
     * @type {string}
     * @memberof IGetOptions
     */
    range?: string;

    /**
     * Optional query parameters
     * @type {string}
     * @memberof IGetOptions
     */
    queryParams?: string

    /**
     * Maximum number of bytes of content that may be held in memory. Get.dataSet and Get.USSFile
     * collect the whole content in memory and fail with an error if it is larger than this;
     * for downloads it limits HTTP error bodies, which are buffered. Must be a positive safe integer.
     * Default: 64 MiB (RestConstants.DEFAULT_MAX_BUFFERED_RESPONSE_BYTES in @zowe/imperative)
     * @type {number}
     * @memberof IGetOptions
     */
    maxBufferedResponseBytes?: number;
}
