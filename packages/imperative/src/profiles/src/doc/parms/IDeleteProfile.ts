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
 * Parameters to the profile manager "delete" API.
 * @export
 * @interface IDeleteProfile
 */
export interface IDeleteProfile {
    /**
     * The name of the profile to delete - the type is specified by the current manager object.
     * @type {string}
     * @memberof IDeleteProfile
     */
    name: string;
    /**
     * If true, rejects the deletion of the profile if it is found to be a dependency of another profile.
     * @type {boolean}
     * @memberof IDeleteProfile
     */
    rejectIfDependency?: boolean;
}
