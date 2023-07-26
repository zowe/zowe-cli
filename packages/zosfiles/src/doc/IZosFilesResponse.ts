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
 * The ZosFiles API response.
 * @export
 */
export interface IZosFilesResponse {
    /**
     * Indicates the success of retrieving specified file information.
     * @type {boolean}
     */
    success: boolean;

    /**
     * Relevant information about the performed file operation.
     * @type {string}
     */
    commandResponse: string;

    /**
     * The api response object, housing any returned header information.
     * @type {*}
     */
    apiResponse?: any;

    /**
     * The error message text.
     * If not defined, the command response will be used.
     * @type {string}
     */
    errorMessage?: string;
}
