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
 * Parameters to the "save()" profile API.
 *
 * Note: This profile could contain the following additional arguments,
 *       which will only be kept in memory (for a short period of time) and NOT saved to a file.
 *   @type {string} username - The username to be securely saved to this profile.
 *   @type {string} password - The password for the username to be securely saved to this profile.
 *
 * @export
 * @interface ISaveProfile
 */
export interface ISaveProfile {
    /**
     * The profile contents - must extend the IProfile interface to function properly with Imperative. The contents
     * are always validated against the schema documents (and basic validation occurs)
     *
     * @type {IProfile}
     * @memberof ISaveProfile
     */
    profile: IProfile;

    /**
     * The name of the profile to save
     *
     * @type {string}
     * @memberof ISaveProfile
     */
    name: string;

    /**
     * The type of profile to save
     * @type {string}
     * @memberof ISaveProfile
     */
    type: string;

    /**
     * Set to true to update the default profile for the profile type.
     * @type {boolean}
     * @memberof ISaveProfile
     */
    updateDefault?: boolean;
    /**
     * Set to true to overwrite an existing profile of the same name. If false, an error is thrown if the profile
     * already exists.
     * @type {boolean}
     * @memberof ISaveProfile
     */
    overwrite?: boolean;

    /**
     * The argument to disable populating defaults
     * @type {boolean}
     * @memberof ISaveProfileFromCliArgs
     */
    disableDefaults?: boolean;
}
