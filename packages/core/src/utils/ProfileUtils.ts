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

import { ImperativeConfig, IProfileLoaded, CliProfileManager, IProfile, Logger, ImperativeError } from "@zowe/imperative";
import * as path from "path";
import * as os from "os";

/**
 * Retrieves the Zowe CLI home directory. In the situation Imperative has
 * not initialized it we mock a default value.
 * @returns {string} - Returns the Zowe home directory
 */
export function getZoweDir(): string {
    const defaultHome = path.join(os.homedir(), ".zowe");
    if (ImperativeConfig.instance.loadedConfig?.defaultHome !== defaultHome) {
        ImperativeConfig.instance.loadedConfig = {
            name: "zowe",
            defaultHome,
            envVariablePrefix: "ZOWE"
        };
    }
    return ImperativeConfig.instance.cliHome;
}

/**
 * Loads default z/OSMF profile. The profile must have already been
 * created using Zowe CLI, and not rely on base profiles
 *
 * @param {string} profileType - The name of the profile type
 * @param {boolean} mergeWithBase - Whether or not to merge with the base profile
 * @returns {IProfile} - The default profile (or merged profile, if requested)
 */
export async function getDefaultProfile(profileType: string, mergeWithBase?: boolean) {

    const profileRootDir: string = path.join(getZoweDir(), "profiles");
    const logger: Logger = Logger.getImperativeLogger();
    let profileManager: CliProfileManager;
    let profileLoaded: IProfileLoaded;

    try {
        // Create the profile manager
        profileManager = new CliProfileManager({
            profileRootDirectory: profileRootDir,
            type: profileType
        });

        // Load the profile using the profile manager
        profileLoaded = await profileManager.load({
            loadDefault: true
        });
    } catch (err) {
        logger.warn(err.message);
    }

    // Throw an error if there was no default profile found and no base profile requested
    if ((!profileLoaded || !profileLoaded.profile) && !mergeWithBase) {
        throw new ImperativeError({msg: `Failed to load default profile of type "${profileType}"`});
    }

    // Give the profile back as-is if the profile is not to be merged with the base profile
    if (mergeWithBase === false) {
        return profileLoaded.profile;
    }

    let baseProfileManager: CliProfileManager;
    let baseProfileLoaded: IProfileLoaded;

    try {
        baseProfileManager = new CliProfileManager({
            profileRootDirectory: profileRootDir,
            type: "base"
        });

        baseProfileLoaded = await baseProfileManager.load({
            loadDefault: true
        });
    } catch (err) {
        logger.warn(err.message);
    }

    // Return service profile if there was no base profile found and service profile existed.
    // Return base profile if there was no service profile found and base profile existed.
    // If both exist, combine. Otherwise, error
    if ((!baseProfileLoaded || !baseProfileLoaded.profile) && (profileLoaded && profileLoaded.profile)) {
        return profileLoaded.profile;
    } else if (baseProfileLoaded && baseProfileLoaded.profile && (!profileLoaded || !profileLoaded.profile)) {
        return baseProfileLoaded.profile;
    } else if ((!baseProfileLoaded || !baseProfileLoaded.profile) && (!profileLoaded || !profileLoaded.profile)) {
        throw new ImperativeError({msg: `Failed to load default profiles of types "${profileType}" and "base"`});
    }

    const combinedProfile: IProfile = JSON.parse(JSON.stringify(baseProfileLoaded.profile));

    for (const propertyName in profileLoaded.profile) {
        if (profileLoaded.profile[propertyName] != null) {
            combinedProfile[propertyName] = profileLoaded.profile[propertyName];
        }
    }

    return combinedProfile;
}