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
 * Change password response.
 *
 * @export
 * @interface IChangePassword
 */
export interface IChangePassword {
    /**
     * Identifies the category of errors (0 = success)
     * @type {number}
     * @memberof IChangePassword
     */
    returnCode: number;

    /**
     * Identifies the specific error (0 = success)
     * @type {number}
     * @memberof IChangePassword
     */
    reasonCode: number;

    /**
     * Describes the text information of the change request
     * @type {string}
     * @memberof IChangePassword
     */
    message: string;
}
