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

import { AbstractProfileManager } from "./abstract/AbstractProfileManager";
import {
    ILoadProfile,
    IProfile,
    IProfileLoaded,
    IProfileTypeConfiguration,
    IProfileValidated,
    IValidateProfileWithSchema
} from "./doc";

import { isNullOrUndefined } from "util";
import { ImperativeError } from "../../error";

/**
 * Basic Profile Manager is the most basic implementation of the Imperative Profile Manager. In general, it invokes
 * all of the utility/services from the Abstract Profile manager to load, save, delete, validate, etc. Imperative
 * profiles. See the "AbstractProfileManager" header for more profile management details.
 *
 * The main differences between the abstract and the basic include:
 *
 * 1) The "loadAll()" API in the basic profile manager loads ALL profiles from all types.
 * 2) The Basic Profile Manager includes the "initialize()" API, which will create all type directories and persist
 *    the schema in the meta files.
 *
 * The Basic Profile Manager can be used "stand-alone" from an Imperative CLI. The intent is to provide apps built
 * using Imperative CLI's to take advantage of the profiles that the user has defined, without having to "locate" the
 * configuration documents used to construct the CLI's. This is why the initialize() API persists the configuration
 * documents within the meta files for each type.
 *
 * @export
 * @class BasicProfileManager
 * @extends {AbstractProfileManager<T>}
 * @template T
 */
export class BasicProfileManager<T extends IProfileTypeConfiguration> extends AbstractProfileManager<T> {
    /**
     * Loads all profiles from every type. Profile types are deteremined by reading all directories within the
     * profile root directory.
     * @internal
     * @returns {Promise<IProfileLoaded[]>} - The list of all profiles for every type
     * @memberof BasicProfileManager
     */
    public async loadAll(): Promise<IProfileLoaded[]> {
        this.log.trace(`Loading all profiles...`);
        // Load all the other profiles for other types
        const loadTheirProfiles: any[] = [];
        let loadList: string = "";
        for (const typeConfig of this.profileTypeConfigurations) {
            const typeProfileManager = new BasicProfileManager({
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
                loadTheirProfiles.push(typeProfileManager.load({name, failNotFound: true, loadDependencies: false}));
                loadList += `\nLoading "${name}" of type "${typeConfig.type}"`;
            }
        }

        // Construct the full list for return
        let allProfiles: IProfileLoaded[] = [];
        try {
            this.log.trace(`Awaiting all loads...`);
            const theirProfiles = await Promise.all(loadTheirProfiles);
            for (const theirs of theirProfiles) {
                allProfiles = allProfiles.concat(theirs);
            }
            this.log.trace(`All loads complete.`);
        } catch (e) {
            const msg: string = `An error occurred attempting to load all profiles of every type. ` +
                `Load List: ${loadList}\nError Details: "${e.message}"`;
            this.log.error(msg);
            throw new ImperativeError({msg});
        }

        return allProfiles;
    }

    /**
     * Loads all dependencies for the profile specified - returns the list in the response structure. Sub-dependencies
     * are also loaded.
     * @protected
     * @param {string} name - the name of hte profile to load dependencies for
     * @param {IProfile} profile - The profile to load dependencies.
     * @param {boolean} [failNotFound=true] - Indicates that you want to avoid failing the request for "not found" errors.
     * @returns {Promise<IProfileLoaded[]>} - The list of profiles loaded with all dependencies.
     * @memberof BasicProfileManager
     */
    protected loadDependencies(name: string, profile: IProfile, failNotFound = true): Promise<IProfileLoaded[]> {
        return new Promise<IProfileLoaded[]>((dependenciesLoaded, loadFailed) => {

            // Construct a list of promises to load all profiles
            const promises: Array<Promise<IProfileLoaded>> = [];
            const responses: IProfileLoaded[] = [];
            if (!isNullOrUndefined(profile.dependencies)) {
                this.log.debug(`Loading dependencies for profile of "${this.profileType}".`);
                let list: string = "";
                for (const dependency of profile.dependencies) {
                    this.log.debug(`Loading dependency "${dependency.name}" of type "${dependency.type}".`);
                    promises.push(new BasicProfileManager({
                        profileRootDirectory: this.profileRootDirectory,
                        typeConfigurations: this.profileTypeConfigurations,
                        type: dependency.type,
                        logger: this.log,
                        loadCounter: this.loadCounter
                    }).load({name: dependency.name, failNotFound}));
                    list += `\nType: "${dependency.type}" Name: "${dependency.name}"`;
                }

                // Wait for all the promises to complete
                Promise.all(promises).then((loadResponses) => {
                    this.log.debug(`All dependencies loaded for profile of type "${this.profileType}".`);
                    // Append the responses for return to caller
                    for (const response of loadResponses) {
                        responses.push(response);
                    }
                    dependenciesLoaded(responses);
                }).catch((loadsFailed) => {
                    this.log.error(`Failure to load dependencies for profile of type "${this.profileType}". ` +
                        `Details: ${loadsFailed.message}`);
                    const err: string = `An error occurred while loading the dependencies of profile ` +
                        `"${name}" of type "${this.profileType}". Dependency load list: ${list}\n\nError Details: ${loadsFailed.message}`;
                    loadFailed(new ImperativeError({msg: err, additionalDetails: loadsFailed}));
                });
            } else {
                this.log.trace(`Profile of type "${this.profileType}" has no dependencies.`);
                dependenciesLoaded([]);
            }
        });
    }

    /**
     * Load a profile from disk - invokes the "loadSpecificProfile" method in the abstract to perform the load.
     * @protected
     * @param {ILoadProfile} parms - Load control params - see the interface for full details
     * @returns {Promise<IProfileLoaded>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async loadProfile(parms: ILoadProfile): Promise<IProfileLoaded> {
        const loadName: string = (parms.loadDefault || false) ? this.getDefaultProfileName() : parms.name;
        this.log.debug(`Loading profile "${loadName}" (load default: "${parms.loadDefault}") of type "${this.profileType}".`);
        return this.loadSpecificProfile(loadName, parms.failNotFound, parms.loadDependencies);
    }

    /**
     * Validate profile - ensures that the profile is valid against the schema and configuration document
     * @protected
     * @param {IValidateProfileWithSchema} parms - Validate control params - see the interface for full details
     * @returns {Promise<IProfileValidated>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async validateProfile(parms: IValidateProfileWithSchema): Promise<IProfileValidated> {
        this.log.trace(`Validating profile "${parms.name}" of type "${this.profileType}"`);
        // Ensure that the profile is not empty
        if (this.isProfileEmpty(parms.profile)) {
            throw new ImperativeError({
                msg: `The profile passed (name "${parms.name}" of type ` +
                    `"${this.profileType}") does not contain any content.`
            });
        }

        // If the configuration indicates this profile type has required dependencies, ensure that those are specified
        // on the profile object passed.
        this.validateRequiredDependenciesAreSpecified(parms.profile);

        // Validate the profile against the schema
        this.validateProfileAgainstSchema(parms.name, parms.profile, parms.strict);

        // Return the response
        this.log.debug(`Profile "${parms.name}" of type "${this.profileType}" is valid.`);
        return {
            message: `Profile "${parms.name}" of type "${this.profileType}" is valid.`
        };
    }
}
