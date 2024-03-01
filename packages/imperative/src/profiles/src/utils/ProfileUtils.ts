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

import { IProfileTypeConfiguration } from "../doc/config/IProfileTypeConfiguration";
import { IProfileLoaded } from "../doc/response/IProfileLoaded";
import { isNullOrUndefined } from "util";
import * as nodePath from "path";

/**
 * Set of static utility methods to assist with creating profile option names from profile types, constructing the
 * root directory, reforming responses for different purposes, etc.
 *
 * @internal
 * @export
 * @class ProfileUtils
 */
export class ProfileUtils {
    /**
     * Construct the profiles root directory, given the "home" directory.
     *
     * @static
     * @param home - The home directory - normally supplied by Imperative.
     * @returns {string} - The profiles root directory
     * @memberof ProfileUtils
     */
    public static constructProfilesRootDirectory(home: string): string {
        return nodePath.normalize(home + "/profiles/");
    }

    /**
     * Accepts an array of responses, which, depending on the depedencies, may have nested depedency arrays, and
     * flattens to a single level (for ease of printing, etc.).
     *
     * @static
     * @param {IProfileLoaded[]} dependencyResponses - The list of load responses
     * @returns {IProfileLoaded[]} - The list of load responses flattened to a single level
     * @memberof ProfileUtils
     */
    public static flattenDependencies(dependencyResponses: IProfileLoaded[]): IProfileLoaded[] {
        let flatten: IProfileLoaded[] = [];
        if (!isNullOrUndefined(dependencyResponses)) {
            for (const response of dependencyResponses) {
                const moreDependencies = (!isNullOrUndefined(response.dependencyLoadResponses)) ?
                    JSON.parse(JSON.stringify(response.dependencyLoadResponses)) : [];
                flatten.push(response);
                delete response.dependencyLoadResponses;
                if (moreDependencies.length > 0) {
                    flatten = flatten.concat(this.flattenDependencies(moreDependencies));
                }
            }
        }
        return flatten;
    }

    /**
     * Accepts the profile configuration document and returns an array of all types.
     *
     * @static
     * @param {IProfileTypeConfiguration[]} profileConfigs - All profile type configuration documents.
     * @returns {string[]} - An array of profile types.
     * @memberof ProfileUtils
     */
    public static getAllTypeNames(profileConfigs: IProfileTypeConfiguration[]): string[] {
        return profileConfigs.map((profile) => {
            return profile.type;
        });
    }

    /**
     * Construct the profile option - e.g banana-profile - Used to append to commands automatically
     * and by the command processor to check if profile options are present.
     * @param {string} type: The module name (e.g. banana)
     * @return {string} -  The full option name
     */
    public static getProfileOption(type: string): string {
        return `${type}-profile`;
    }

    /**
     * Construct the profile option alias - e.g banana-p- Used to append to commands automatically
     * and by the command processor to check if profile options are present.
     * @param {string} type: The module name (e.g. banana)
     * @return {string} -  The alias for the profile option
     */
    public static getProfileOptionAlias(type: string): string {
        return type + "-p";
    }

    /**
     * Returns the standard profile option name like "banana-profile" and its alias
     * @param {string} type: The type of the profile
     * @return {[string , string]}: The option and its alias
     */
    public static getProfileOptionAndAlias(type: string): [string, string] {
        return [ProfileUtils.getProfileOption(type), ProfileUtils.getProfileOptionAlias(type)];
    }

    /**
     * Create a mapKey value to identify a profile
     * @param {string} type - Type of the profile
     * @param {string} name - Name of the profile
     * @return {string} - Key identifying the profile
     */
    public static getProfileMapKey(type: string, name: string): string {
        return type + "_" + name;
    }

    /**
     * Create a key value to identify a property on a profile
     * @param {string} type - Type of the profile
     * @param {string} name - Name of the profile
     * @param {string} name - Name of the profile
     * @return {string} - Key identifying the profile
     */
    public static getProfilePropertyKey(type: string, name: string, field: string): string {
        return this.getProfileMapKey(type, name) + "_" + field.split(".").join("_");
    }
}
