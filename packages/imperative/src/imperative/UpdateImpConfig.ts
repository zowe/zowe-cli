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

import { ImperativeConfig } from "../../src/utilities/ImperativeConfig";
import { IImperativeConfig } from "./doc/IImperativeConfig";
import { ICommandDefinition, ICommandProfileTypeConfiguration } from "../../src/cmd";
import { Logger } from "../../src/logger";

/**
 * This class is used to update the imperative config object, that was initially
 * loaded by the Imperative module. It exists in a separate module to avoid
 * cyclic dependencies that would occur if the functions lived in the
 * Imperative module.
 */
export class UpdateImpConfig {
    /**
     * Add a new command group by inserting it to the definitions list of the loaded config.
     * @param {ICommandDefinition} cmdDefToAdd - command definition group to to be added.
     */
    public static addCmdGrp(cmdDefToAdd: ICommandDefinition): void {
        const impConfig: IImperativeConfig = ImperativeConfig.instance.loadedConfig;
        const impLogger: Logger = Logger.getImperativeLogger();
        if (impConfig != null) {
            if (impConfig.definitions == null) {
                impConfig.definitions = [];
            }
            const defIndex = impConfig.definitions.indexOf(cmdDefToAdd);
            if (defIndex > -1) {
                impConfig.definitions.splice(defIndex, 1);
            }
            impLogger.debug("Adding definition = '" + cmdDefToAdd.name + "'");
            impConfig.definitions.push(cmdDefToAdd);
        }
    }

    /**
     * Add a new set of profiles by inserting them into the profiles of the loaded config.
     * @param {ICommandProfileTypeConfiguration[]} profiles
     *    Array of profiles to be added.
     */
    public static addProfiles(profiles: ICommandProfileTypeConfiguration[]): void {
        const impConfig: IImperativeConfig = ImperativeConfig.instance.loadedConfig;
        const impLogger: Logger = Logger.getImperativeLogger();
        if (impConfig) {
            if (!impConfig.profiles) {
                impConfig.profiles = [];
            }
            for (const profileToAdd of profiles) {
                /* We expect to not find (ie, undefined result) an exiting profile
                 * with the same type value as the profile that we want to add.
                 */
                const existingProfile: ICommandProfileTypeConfiguration =
                    impConfig.profiles.find((profileToTest) => {
                        return profileToTest.type === profileToAdd.type;
                    });
                if (existingProfile) {
                    impLogger.error("addProfilesToLoadedConfig: The profile of type '" + profileToAdd.type +
                        "' already exists. It will not be added.");
                    continue;
                }
                impLogger.debug("addProfilesToLoadedConfig: Adding " + profileToAdd.type + " profile");
                impConfig.profiles.push(profileToAdd);
            } // end for
        } // end if loadedConfig not null
    }

}
