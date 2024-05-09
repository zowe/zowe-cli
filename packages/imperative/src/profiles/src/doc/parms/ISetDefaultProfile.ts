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
 * Parameters for the setDefault Profile Manager API.
 * @export
 * @interface ISetDefaultProfile
 */
export interface ISetDefaultProfile {
    /**
     * The name of the profile to set as the default (the type is indicated by the profile manager object).
     * @type {string}
     * @memberof ISetDefaultProfile
     */
    name: string;
}
