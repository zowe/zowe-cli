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

import { IProfile } from "../definition/IProfile";
/**
 * The success response to the profile "save()" API.
 * @export
 * @interface IProfileSaved
 */
export interface IProfileSaved {
    /**
     * The path that the new profile was written to
     * @type {string}
     * @memberof IProfileSaved
     */
    path: string;
    /**
     * A message describing the result of the profile creation - for display purposes
     * @type {string}
     * @memberof IProfileSaved
     */
    message: string;
    /**
     * True if the profile saved overwrote an existing profile of the same name/type.
     *
     * @type {boolean}
     * @memberof IProfileSaved
     */
    overwritten: boolean;
    /**
     * The contents of the profile saved.
     * @type {IProfile}
     * @memberof IProfileSaved
     */
    profile?: IProfile;
}
