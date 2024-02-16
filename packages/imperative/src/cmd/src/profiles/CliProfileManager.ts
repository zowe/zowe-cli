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

import { BasicProfileManager } from "../../../profiles";
import { ImperativeError } from "../../../error";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import { IProfileLoaded } from "../../../profiles/src/doc";
import { ICliLoadAllProfiles } from "../doc/profiles/parms/ICliLoadAllProfiles";

/**
 * A profile management API compatible with transforming command line arguments into
 * profiles
 * @internal
 */
export class CliProfileManager extends BasicProfileManager<ICommandProfileTypeConfiguration> {

    /**
     * NOTE: This is just a copy of BasicProfileManager.loadAll
     * REASON: We needed the Abstract profile manager to call the CLI profile manager to handle loading of secure properties
     * Loads all profiles from every type. Profile types are determined by reading all directories within the
     * profile root directory.
     * @returns {Promise<IProfileLoaded[]>} - The list of all profiles for every type
     */
    public async loadAll(params?: ICliLoadAllProfiles): Promise<IProfileLoaded[]> {
        this.log.trace(`Loading all profiles for type "${this.profileType}"...`);
        // Load all the other profiles for other types
        const loadAllProfiles: any[] = [];

        // Load only the profiles for the type if requested
        if (params != null && params.typeOnly) {
            const names: string[] = this.getAllProfileNames();
            for (const name of names) {
                loadAllProfiles.push(this.load({
                    name,
                    failNotFound: true,
                    loadDependencies: false,
                    noSecure: params.noSecure
                }));
            }
        } else {

            // Otherwise, load all profiles of all types
            for (const typeConfig of this.profileTypeConfigurations) {
                const typeProfileManager = new CliProfileManager({
                    profileRootDirectory: this.profileRootDirectory,
                    typeConfigurations: this.profileTypeConfigurations,
                    type: typeConfig.type,
                    logger: this.log,
                    loadCounter: this.loadCounter
                });

                // Get all the profile names for the type and attempt to load every one
                const names: string[] = typeProfileManager.getAllProfileNames();
                for (const name of names) {
                    this.log.debug(`Loading profile "${name}" of type "${typeConfig.type}".`);
                    loadAllProfiles.push(typeProfileManager.load({
                        name,
                        failNotFound: true,
                        loadDependencies: false,
                        noSecure: (params != null) ? params.noSecure : undefined
                    }));
                }
            }
        }

        // Construct the full list for return
        let allProfiles: IProfileLoaded[] = [];
        try {
            this.log.trace(`Awaiting all loads...`);
            const theirProfiles = await Promise.all(loadAllProfiles);
            for (const theirs of theirProfiles) {
                allProfiles = allProfiles.concat(theirs);
            }
            this.log.trace(`All loads complete.`);
        } catch (e) {
            this.log.error(e.message);
            throw new ImperativeError({msg: e.message, additionalDetails: e.additionalDetails, causeErrors: e});
        }

        return allProfiles;
    }
}
