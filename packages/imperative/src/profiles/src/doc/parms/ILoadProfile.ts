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
 * Profile Manager "loadProfile" input parameters. Indicates which profile to load (named or default) and if
 * not finding the profile should be considered and error, etc.
 * @export
 * @interface ILoadProfile
 */
export interface ILoadProfile {
    /**
     * The name of the profile to load - ignored if "loadDefault" is true - the type is indicated by the
     * instance of the instantiated profile manager.
     * @type {string}
     * @memberof ILoadProfile
     */
    name?: string;
    /**
     * Load the default profile for the "type" specified in the profile manager instance - if specified, "name" is
     * ignored.
     * @type {boolean}
     * @memberof ILoadProfile
     */
    loadDefault?: boolean;
    /**
     * Under "normal" circumstances, attempting to load a non-existant profile is an error, however, you may indicate
     * that the profile manager should treat this as a "soft" failure, meaning the promise for the load API will
     * be fulfilled - with the appropriate status message and no profile.
     * @type {boolean}
     * @memberof ILoadProfile
     */
    failNotFound?: boolean;
    /**
     * Profiles can have dependencies. Specify "false" if you want to avoid loading the dependencies of this profile.
     * True is the default.
     * @type {boolean}
     * @memberof ILoadProfile
     */
    loadDependencies?: boolean;
    /**
     * If true, fields that indicate "secure" are not loaded. The properties will still be present in the profiles
     * loaded with a value of "securely_stored".
     * @type {boolean}
     * @memberof ILoadProfile
     */
    noSecure?: boolean;
}
