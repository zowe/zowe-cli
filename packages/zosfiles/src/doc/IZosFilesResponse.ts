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
     * indicates if the command ran successfully.
     * @type {boolean}
     */
    success: boolean;

    /**
     * The command response text.
     * @type {string}
     */
    commandResponse: string;

    /**
     * The api response object.
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
