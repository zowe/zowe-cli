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
    IDeleteProfile,
    ILoadProfile,
    IMetaProfile,
    IProfile,
    IProfileDeleted,
    IProfileInitialized,
    IProfileLoaded,
    IProfileManagerInit,
    IProfileSaved,
    IProfileTypeConfiguration,
    IProfileUpdated,
    IProfileValidated,
    ISaveProfile,
    IUpdateProfile,
    IValidateProfileWithSchema
} from "./doc";

import { ImperativeExpect } from "../expect";
import { isNullOrUndefined } from "util";
import { ImperativeError } from "../error";
import { ProfileIO } from "./utils";

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
     * Static method to initialize the profile environment. Accepts the profile root directory (normally supplied by
     * your Imperative configuration documents) and all profile "type" configuration documents and constructs the directories
     * needed to manage profiles of all types. You must execute this method before beginning to use profiles OR you must
     * supply all the type configuration documents (normally obtained from your Imperative configuration document) to
     * the constructor of
     * @static
     * @param {IProfileManagerInit} parms
     * @returns {Promise<IProfileInitialized[]>}
     * @memberof AbstractProfileManager
     */
    public static async initialize(parms: IProfileManagerInit): Promise<IProfileInitialized[]> {
        // Validate the input parameters - TODO: Validate all
        ImperativeExpect.toNotBeNullOrUndefined(
            parms,
            `A request was made to initialize the profile environment, but no parameters were supplied.`
        );
        ImperativeExpect.keysToBeDefined(parms, ["configuration"],
            `A request was made to initialize the profile environment, but no configuration documents were supplied.`
        );
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["profileRootDirectory"],
            `A request was made to initialize the profile environment, but the profile root directory was not supplied.`
        );
        ImperativeExpect.keysToBeAnArray(parms, true, ["configuration"],
            `A request was mad to initialize the profile environment, but the configuration provided is invalid (not an array or of length 0).`
        );

        // Set any defaults
        parms.reinitialize = (isNullOrUndefined(parms.reinitialize)) ? false : parms.reinitialize;

        // Create the profile root directory (if necessary)
        ProfileIO.createProfileDirs(parms.profileRootDirectory);

        // Iterate through the types and create this types configuration document - create a new instance of the
        // Manager to create the other types
        const responses: IProfileInitialized[] = [];
        for (const config of parms.configuration) {

            // Construct the profile type directory
            const profileTypeRootDir = parms.profileRootDirectory + "/" + config.type + "/";
            ProfileIO.createProfileDirs(profileTypeRootDir);

            // Meta file path and name
            const metaFilePath = profileTypeRootDir + config.type
                + AbstractProfileManager.META_FILE_SUFFIX + AbstractProfileManager.PROFILE_EXTENSION;

            // Construct the default meta file
            const defaultMetaFile: IMetaProfile<IProfileTypeConfiguration> = {
                defaultProfile: undefined,
                configuration: config
            };

            // If the directory doesn't exist, create it and the default meta file for this type
            // If the directory exists and re-init was specified, write out the default meta file
            // If it exists and re-init was not specified, leave it alone
            if (!ProfileIO.exists(metaFilePath)) {
                ProfileIO.writeMetaFile(defaultMetaFile, metaFilePath);
                responses.push({
                    message: `Profile environment initialized for type "${config.type}".`
                });
            } else if (parms.reinitialize) {
                ProfileIO.writeMetaFile(defaultMetaFile, metaFilePath);
                responses.push({
                    message: `Profile environment re-initialized for type "${config.type}".`
                });
            }
        }

        return responses;
    }

    /**
     * Loads all profiles from every type. Profile types are deteremined by reading all directories within the
     * profile root directory.
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
     * Save the profile to disk. First ensures that all dependencies are valid and writes the profile.
     * @protected
     * @param {ISaveProfile} parms - Save control params - see the interface for full details
     * @returns {Promise<IProfileSaved>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async saveProfile(parms: ISaveProfile): Promise<IProfileSaved> {
        // Validate that the dependencies listed exist before saving
        try {
            this.log.debug(`Loading dependencies for profile "${parms.name}" of type "${this.profileType}", ` +
                `checking if if they are valid (before save.)`);
            await this.loadDependencies(parms.name, parms.profile);
        } catch (e) {
            throw new ImperativeError({
                msg: `Could not save the profile, because one or more dependencies is invalid or does not exist.\n` +
                    `Load Error Details: ${e.message}`
            });
        }

        // Construct the full file path, write to disk, and return the response
        this.log.info(`Saving profile "${parms.name}" of type "${this.profileType}"...`);
        const path = this.constructFullProfilePath(parms.name);
        ProfileIO.writeProfile(path, parms.profile);
        this.log.info(`Profile "${parms.name}" of type "${this.profileType}" saved.`);
        return {
            path,
            overwritten: parms.overwrite || false,
            message: `Profile ("${parms.name}" of type "${this.profileType}") ` +
                `successfully written: ${path}`,
            profile: parms.profile
        };
    }

    /**
     * Load a profile from disk - invokes the "loadSpecificProfile" method in the abstract to perform the load.
     * @protected
     * @param {ILoadProfile} parms - Load control params - see the interface for full details
     * @returns {Promise<IProfileSaved>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async loadProfile(parms: ILoadProfile): Promise<IProfileLoaded> {
        const loadName: string = (parms.loadDefault || false) ? this.getDefaultProfileName() : parms.name;
        this.log.debug(`Loading profile "${loadName}" (load default: "${parms.loadDefault}") of type "${this.profileType}".`);
        return this.loadSpecificProfile(loadName, parms.failNotFound, parms.loadDependencies);
    }

    /**
     * Delete a profile from disk - invokes the "deleteProfileFromDisk" method in the abstract to perform the load.
     * @protected
     * @param {IDeleteProfile} parms - Delete control params - see the interface for full details
     * @returns {Promise<IProfileDeleted>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async deleteProfile(parms: IDeleteProfile): Promise<IProfileDeleted> {
        this.log.trace(`Removing profile "${parms.name}" of type "${this.profileType}".`);
        const path = this.deleteProfileFromDisk(parms.name);
        this.log.debug(`Profile "${parms.name}" of type "${this.profileType}" successfully deleted.`);
        return {
            path,
            message: `Profile "${parms.name}" of type "${this.profileType}" deleted successfully.`
        };
    }

    /**
     * Validate profile - ensures that the profile is valid agaisnt the schema and configuration document
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

        // Validate the profile agaisnt the schema
        this.validateProfileAgainstSchema(parms.name, parms.profile, parms.strict);

        // Return the response
        this.log.debug(`Profile "${parms.name}" of type "${this.profileType}" is valid.`);
        return {
            message: `Profile "${parms.name}" of type "${this.profileType}" is valid.`
        };
    }

    /**
     * Update a profile - Accepts the "new" version of the profile and overwrites the existing profile on disk.
     * @protected
     * @param {IUpdateProfile} parms - Update control params - see the interface for full details
     * @returns {Promise<IProfileUpdated>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     * @memberof BasicProfileManager
     */
    protected async updateProfile(parms: IUpdateProfile): Promise<IProfileUpdated> {
        this.log.trace(`Saving (as part of updating) profile "${parms.name}" of type "${this.profileType}".`);
        if (parms.merge) {
            this.log.debug(`Profile merging was requested. Loading the old version of the profile ` +
                `"${parms.name}" of type "${this.profileType}".`);
            const oldProfileLoad = await this.load({name: parms.name, failNotFound: true});
            parms.profile = this.mergeProfiles(oldProfileLoad.profile, parms.profile);
            this.log.debug(`Merged profile "${parms.name}" of type "${this.profileType}" with old version`);
        }
        const response = await this.save({
            name: parms.name,
            type: this.profileType,
            profile: parms.profile,
            overwrite: true
        });
        this.log.trace(`Save of profile "${parms.name}" of type "${this.profileType}" complete.`);
        return {
            path: response.path,
            message: `Profile "${parms.name}" of type "${this.profileType}" updated successfully.`,
            profile: response.profile
        };
    }
}
