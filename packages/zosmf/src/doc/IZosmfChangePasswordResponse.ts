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
 * z/OSMF change password/passphrase response.
 * @export
 * @interface IZosmfChangePasswordResponse
 */
export interface IZosmfChangePasswordResponse {
    /**
     * Whether the password change completed successfully.
     * @type {boolean}
     */
    success: boolean;

    /**
     * Identifies the category of errors (0 = success).
     * @type {number}
     */
    returnCode: number;

    /**
     * Identifies the specific error (0 = success).
     * @type {number}
     */
    reasonCode: number;

    /**
     * Describes the text information of the change request.
     * @type {string}
     */
    message: string;
}
