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
 * Generic response interface for a change password operation.
 * @export
 * @interface IChangePasswordResponse
 */
export interface IChangePasswordResponse {
    /**
     * Whether the password change completed successfully.
     * @type {boolean}
     */
    success: boolean;

    /**
     * Generic response data returned by the service.
     * @type {{ [key: string]: unknown }}
     */
    data?: { [key: string]: unknown };
}
