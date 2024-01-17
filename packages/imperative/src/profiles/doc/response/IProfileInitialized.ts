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
 * Response to the Basic profile manager's initialize API - normally provided as an array to the caller indicating
 * each profile type that was initialized.
 * @export
 * @interface IProfileInitialized
 */
export interface IProfileInitialized {
    /**
     * The message indicating that the profile type was initialized or re-initialized.
     * @type {string}
     * @memberof IProfileInitialized
     */
    message: string;
}
