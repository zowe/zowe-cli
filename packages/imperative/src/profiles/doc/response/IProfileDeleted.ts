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
 * The success response to the profile "delete()" API.
 * @export
 * @interface IProfileDeleted
 */
export interface IProfileDeleted {
    /**
     * The path to the profile that was deleted.
     * @type {string}
     * @memberof IProfileDeleted
     */
    path: string;
    /**
     * The message - for display purposes - e.g. The profile was successfully deleted.
     * @type {string}
     * @memberof IProfileDeleted
     */
    message: string;
    /**
     * Specifies whether the default profile was cleared.
     * @type {boolean}
     * @memberof IProfileDeleted
     */
    defaultCleared?: boolean;
}
