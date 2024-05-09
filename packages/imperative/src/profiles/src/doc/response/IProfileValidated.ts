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
 * The success response to the profile "validate()" APi.
 * @export
 * @interface IProfileValidated
 */
export interface IProfileValidated {
    /**
     * Message - for display purposes - e.g. The profile was updated.
     * @type {string}
     * @memberof IProfileValidated
     */
    message: string;
}
