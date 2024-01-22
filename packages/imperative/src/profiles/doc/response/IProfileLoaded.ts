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
 * The success response to the profile "load()" API.
 * @export
 * @interface IProfileLoaded
 */
export interface IProfileLoaded {
    /**
     * API response message - for display and logging purposes
     * @type {string}
     * @memberof IProfileLoaded
     */
    message: string;
    /**
     * The profile "type" of the profile loaded.
     * @type {string}
     * @memberof IProfileLoaded
     */
    type: string;
    /**
     * The "failNotFound" specification value on original request.
     * @type {boolean}
     * @memberof IProfileLoaded
     */
    failNotFound: boolean;
    /**
     * Indicates the a profile type that references this profile - populated when the dependencies are
     * loaded for a particular profile chain
     * TODO - this might no longer be necessary - will need to investigate the impact on the command processor (loading profs)
     * @type {string}
     * @memberof IProfileLoaded
     */
    referencedBy?: string;
    /**
     * The name of the profile
     * @type {string}
     * @memberof IProfileLoaded
     */
    name?: string;
    /**
     * The profile contents.
     * @type {IProfile}
     * @memberof IProfileLoaded
     */
    profile?: IProfile;
    /**
     * Indicates that mutliple profiles were loaded - due to dependencies.
     * @type {boolean}
     * @memberof IProfileLoaded
     */
    dependenciesLoaded?: boolean;
    /**
     * Full set of profile loaded responses.
     * @type {IProfileLoaded[]}
     * @memberof IProfileLoaded
     */
    dependencyLoadResponses?: IProfileLoaded[];
}
