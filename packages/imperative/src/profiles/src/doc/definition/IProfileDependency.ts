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
 * Definition for a dependency on another profile.
 * For example you can have a "fruit-ordering" profile which depends on a particular
 * instance of a "banana" type profile.
 * This way when you are issuing commands that require a "fruit-ordering" profile,
 * you can associate a particular set of settings of type "banana".
 */
export interface IProfileDependency {
    /**
     * The name of the profile type
     */
    type: string;

    /**
     * Can the user use your profile without  associating a dependent profile with it?
     * If so, it is not required.
     */
    required: boolean;
    /**
     * The description to expose on the auto-generated command line options
     * on profile create and update commands.
     */
    description?: string;
}
