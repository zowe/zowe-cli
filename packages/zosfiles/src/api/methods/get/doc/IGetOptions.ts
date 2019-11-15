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

/**
 * This interface defines the options that can be sent to get a data set or USS file function
 * @export
 * @interface IGetOptions
 */
export interface IGetOptions {
    /**
     * The indicator to view the data set or USS file in binary mode
     * @type {boolean}
     */
    binary?: boolean;

    /**
     * The volume on which the data set is stored
     * @type {string}
     */
    volume?: string;

    /**
     * The indicator to force return of ETag.
     * If set to 'true' it forces the response to include an "ETag" header, regardless of the size of the response data.
     * If it is not present, the the default is to only send an Etag for data sets smaller than a system determined length,
     * which is at least 8MB.
     */
    returnEtag?: boolean;
}
