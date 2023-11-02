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

import * as nodePath from "path";
import { inspect, isString } from "util";

import { ImperativeExpect } from "../../expect/ImperativeExpect";
import { ImperativeError } from "../../error/ImperativeError";
import { Logger } from "../../logger/Logger";
import {
    IDeleteProfile,
    ILoadProfile,
    IMetaProfile,
    IProfile,
    IProfileDeleted,
    IProfileDependency,
    IProfileLoaded,
    IProfileManager,
    IProfileSaved,
    IProfileSchema,
    IProfileTypeConfiguration,
    IProfileUpdated,
    IProfileValidated,
    ISaveProfile,
    IUpdateProfile,
    IValidateProfile,
    IValidateProfileWithSchema,
    ILoadAllProfiles
} from "../doc";
import { ProfileIO, ProfileUtils } from "../utils";
import { ImperativeConfig } from "../../utils/ImperativeConfig";

const SchemaValidator = require("jsonschema").Validator;

/**
 * The abstract profile manager contains most (if not all in some cases) methods to manage Imperative profiles. Profiles
 * are user configuration documents intended to be used on commands, as a convenience, to supply a slew of additional
 * input and configuration (normally more than would be feasible as command arguments). See the "IProfile" interface
 * for a detailed description of profiles, their use case, and examples.
 *
 * The abstract manager is implemented by (at least as part of Imperative) the BasicProfileManager. The BasicProfileManager
 * implements the save, load, update, etc. methods in, as the name implies, a "basic" way. In general, the abstract
 * manager contains all parameter and profile validation code, methods to write/read/etc and the Basic Manager uses
 * most of the internal methods to perform the "work". The basic manager does in some cases change the default abstract
 * behavior (such as for loadAll profile and loadDependencies).
 *
 * Imperative, however, uses the the "Cli Profile Manager", which extends the "Basic Profile Manager". The CLI Manager includes
 * additional capabilities, such as creating or updating a profile from command line arguments.
 *
 * In general, Imperative CLI's will use the "Cli Profile Manager", where the "Basic Profile Manager" is normally sufficient
 * for usage outside of Imperative (for usage in building extensions to editors, Electron apps, programmatic usage of
 * APIs built by implementations of Imperative, etc.), although either can be used.
 *
 * It is not an absolute requirement, but in the case of an Imperative CLI, the "Basic Profile Manager initialize()" API
 * is invoked to create the required directories and sub-directories. This is NOT a requirement, but avoiding "initialize()"
 * means you must supply all configuration information to the manager when creating an instance. See the "initialize()" API
 * method in the "BasicProfileManager" for full details.
 *
 * @export
 * @abstract
 * @class AbstractProfileManager
 */
export abstract class AbstractProfileManager<T extends IProfileTypeConfiguration> {
    /**
     * The default profile file extension (YAML format) - all profiles are stored in YAML format including
     * the meta profile file.
     * @static
     * @type {string}
     * @memberof ProfileManager
     */
    public static readonly PROFILE_EXTENSION: string = ".yaml";

    /**
     * The meta file suffix - always appended to the meta file to distinguish from other profiles. Users then cannot
     * supply a profile name that would conflict with the meta file.
     * @static
     * @type {string}
     * @memberof AbstractProfileManager
     */
    public static readonly META_FILE_SUFFIX: string = "_meta";

    /**
     * Load counter for this instance of the imperative profile manager. The load counter ensures that we are not
     * attempting to load circular dependencies by checking if a load (with dependencies) is attempting a load of
     * the same profile twice. The counts are reset when the loads complete, so state should be preserved correctly.
     * @private
     * @static
     * @type {Map<string, number>}
     * @memberof AbstractProfileManager
     */
    private mLoadCounter: Map<string, number> = new Map<string, number>();

    /**
     * Parameters passed on the constructor (normally used to create additional instances of profile manager objects)
     * @private
     * @type {IProfileManager}
     * @memberof AbstractProfileManager
     */
    private mConstructorParms: IProfileManager<T>;

    /**
     * The profile root directory is normally supplied on an Imperative configuration document, but it is the
     * location where all profile type directories are stored.
     * @private
     * @type {string}
     * @memberof AbstractProfileManager
     */
    private mProfileRootDirectory: string;

    /**
     * The full set of profile type configurations. The manager needs to ensure that A) the profile type configuration
     * is among the set (because it contains schema and dependency specifications) and B) That other type configurations
     * are available to verify/load dependencies, etc.
     * @private
     * @type {T[]}
     * @memberof AbstractProfileManager
     */
    private mProfileTypeConfigurations: T[];

    /**
     * The profile "type" for this manager - indicating the profile/schema that this manager is working directly with.
     * @private
     * @type {string}
     * @memberof AbstractProfileManager
     */
    private mProfileType: string;

    /**
     * The profile configuration document for the "type" defined to this manager. Contains the schema and dependency
     * specifications for the profile type.
     * @private
     * @type {T}
     * @memberof AbstractProfileManager
     */
    private mProfileTypeConfiguration: T;

    /**
     * The profile schema for the "type". The JSON schema is used to validate any profiles loaded or saved by this
     * profile manager for the type.
     * @private
     * @type {IProfileSchema}
     * @memberof AbstractProfileManager
     */
    private mProfileTypeSchema: IProfileSchema;

    /**
     * The root directory for the type (contained within the profile root directory).
     * @private
     * @type {string}
     * @memberof AbstractProfileManager
     */
    private mProfileTypeRootDirectory: string;

    /**
     * The meta file name for this profile type. Of the form "<type>_meta".
     * @private
     * @type {string}
     * @memberof AbstractProfileManager
     */
    private mProfileTypeMetaFileName: string;

    /**
     * Product display name of the CLI.
     * @private
     * @type {string}
     * @memberof AbstractProfileManager
     */
    private mProductDisplayName: string;

    /**
     * Logger instance - must be log4js compatible. Can be the Imperative logger (normally), but is required for
     * profile manager operation.
     * @private
     * @type {Logger}
     * @memberof AbstractProfileManager
     */
    private mLogger: Logger = Logger.getImperativeLogger();

    /**
     * Creates an instance of ProfileManager - Performs basic parameter validation and will create the required
     * profile root directory (if it does not exist) and will attempt to load type configurations from the
     * existing profile root directory (unless the type definitions are passed on the constructor parameters).
     *
     * @param {IProfileManager} parms - See the interface for details.
     * @memberof ProfileManager
     */
    constructor(parms: IProfileManager<T>) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, "Profile Manager input parms not supplied.");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["type"],
            "No profile type supplied on the profile manager parameters.");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["profileRootDirectory"],
            "No profile root directory supplied on the profile manager parameters");
        if (parms.loadCounter != null) {
            this.mLoadCounter = parms.loadCounter;
        }
        this.mLogger = parms.logger ?? this.mLogger;
        this.mProfileType = parms.type;
        this.mProfileRootDirectory = parms.profileRootDirectory;
        this.mProfileTypeConfigurations = parms.typeConfigurations;
        this.mProductDisplayName = parms.productDisplayName;
        if (this.profileTypeConfigurations == null || this.profileTypeConfigurations.length === 0) {
            try {
                this.mProfileTypeConfigurations = this.collectAllConfigurations();
                if (this.mProfileTypeConfigurations.length === 0) {
                    throw new ImperativeError({
                        msg: `No profile configurations found. ` +
                            `Please initialize the profile manager OR supply the configurations to the profile manager.`
                    });
                }
            } catch (e) {
                throw new ImperativeError({
                    msg: `An error occurred collecting all configurations ` +
                        `from the profile root directory "${this.profileRootDirectory}". ` +
                        `Please supply the configurations on the profile manager constructor parameters ` +
                        `OR initialize the profile manager environment. Details: ${e.message}`,
                    additionalDetails: e
                });
            }
        }
        this.mConstructorParms = parms;
        this.mProfileTypeConfiguration = ImperativeExpect.arrayToContain(this.mProfileTypeConfigurations, (entry) => {
            return entry.type === this.mProfileType;
        }, `Could not locate the profile type configuration for "${this.profileType}" within the input configuration list passed.` +
            `\n${inspect(this.profileTypeConfigurations, {depth: null})}`);
        for (const config of this.profileTypeConfigurations) {
            this.validateConfigurationDocument(config);
        }
        this.mProfileTypeSchema = this.mProfileTypeConfiguration.schema;
        this.mProfileTypeRootDirectory = this.createProfileTypeDirectory();
        this.mProfileTypeMetaFileName = this.constructMetaName();
    }

    /**
     * Accessor for the load counter (protects against circular loading)
     * @readonly
     * @protected
     * @type {Map<string, number>}
     * @memberof AbstractProfileManager
     */
    protected get loadCounter(): Map<string, number> {
        return this.mLoadCounter;
    }

    /**
     * Accessor for the logger instance - passed on the constructor
     * @readonly
     * @protected
     * @type {Logger}
     * @memberof AbstractProfileManager
     */
    protected get log(): Logger {
        return this.mLogger;
    }

    /**
     * Accessor the input parameters to the constructor - used sometimes to create other instances of profile managers.
     * @readonly
     * @protected
     * @type {IProfileManager}
     * @memberof AbstractProfileManager
     */
    protected get managerParameters(): IProfileManager<T> {
        return this.mConstructorParms;
    }

    /**
     * Accessor for the profile type specified on the constructor.
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractProfileManager
     */
    protected get profileType(): string {
        return this.mProfileType;
    }

    /**
     * Accesor for the product display name.
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractProfileManager
     */
    protected get productDisplayName(): string {
        return this.mProductDisplayName;
    }

    /**
     * Accessor for the profile type configuration for this manager.
     * @readonly
     * @protected
     * @type {T}
     * @memberof AbstractProfileManager
     */
    protected get profileTypeConfiguration(): T {
        return this.mProfileTypeConfiguration;
    }

    /**
     * Accessor for the full set of type configurations - passed on the constructor or obtained from reading
     * the profile root directories and meta files.
     * @readonly
     * @protected
     * @type {T[]}
     * @memberof AbstractProfileManager
     */
    protected get profileTypeConfigurations(): T[] {
        return this.mProfileTypeConfigurations;
    }

    /**
     * Accessor for the schema of this type - JSON schema standard
     * @readonly
     * @protected
     * @type {IProfileSchema}
     * @memberof AbstractProfileManager
     */
    protected get profileTypeSchema(): IProfileSchema {
        return this.mProfileTypeSchema;
    }

    /**
     * Accessor for the profile type root directory (contained within the profile root directory and named by the type itself)
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractProfileManager
     */
    protected get profileTypeRootDirectory(): string {
        return this.mProfileTypeRootDirectory;
    }

    /**
     * Accessor for the profile meta file name - constructed as "<type>_meta"
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractProfileManager
     */
    protected get profileTypeMetaFileName(): string {
        return this.mProfileTypeMetaFileName;
    }

    /**
     * Accessor for the profile root directory - supplied on the constructor - used to construct the profile type
     * directory.
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractProfileManager
     */
    protected get profileRootDirectory(): string {
        return this.mProfileRootDirectory;
    }

    /**
     * Obtains all profile names for the profile "type" specified on the manager. The names are obtained from the
     * filesystem (in the profile type directory) and the meta file is NOT returned in the list.
     * @returns {string[]} - The list of profile names (obtained from disk).
     * @memberof AbstractProfileManager
     */
    public getAllProfileNames(): string[] {
        return ProfileIO.getAllProfileNames(this.profileTypeRootDirectory,
            AbstractProfileManager.PROFILE_EXTENSION, this.constructMetaName());
    }

    /**
     * Accessor that returns a copy of of the profile configuration document.
     * @readonly
     * @type {IProfileTypeConfiguration[]}
     * @memberof AbstractProfileManager
     */
    public get configurations(): IProfileTypeConfiguration[] {
        return JSON.parse(JSON.stringify(this.profileTypeConfigurations ?? []));
    }

    /**
     * Save a profile to disk. Ensures that the profile specified is valid (basic and schema validation) and invokes the implementations
     * "saveProfile" method to perform the save and formulate the response.
     * @template S
     * @param {ISaveProfile} parms - See interface for details
     * @returns {Promise<IProfileSaved>} - The promise that is fulfilled with the response object (see interface for details) or rejected
     * with an Imperative Error.
     * @memberof AbstractProfileManager
     */
    public async save<S extends ISaveProfile>(parms: S): Promise<IProfileSaved> {
        // Validate the input parameters
        ImperativeExpect.toNotBeNullOrUndefined(parms,
            `A request was made to save a profile of type "${this.profileType}", but no parameters were supplied.`);
        ImperativeExpect.keysToBeDefined(parms, ["profile"],
            `A request was made to save a profile of type "${this.profileType}", but no profile was supplied.`);
        ImperativeExpect.keysToBeDefined(parms, ["name"],
            `A request was made to save a profile of type "${this.profileType}", but no name was supplied.`);

        // Ensure that the type is filled in - a mismatch will be thrown if the type indicates a type other than the manager's current type
        parms.type = parms.type || this.profileType;

        // Log the invocation
        this.log.info(`Saving profile "${parms.name}" of type "${this.profileType}"...`);

        // Perform basic profile object validation (not specific to create - just that the object is correct for our usage here)
        this.log.debug(`Validating the profile ("${parms.name}" of type "${this.profileType}") before save.`);
        await this.validate({
            name: parms.name,
            profile: parms.profile
        });

        // Protect against overwriting the profile - unless explicitly requested
        this.protectAgainstOverwrite(parms.name, parms.overwrite || false);

        // Invoke the implementation
        this.log.trace(`Invoking save profile of implementation...`);
        const response = await this.saveProfile(parms);
        if (response == null) {
            throw new ImperativeError({msg: `The profile manager implementation did NOT return a profile save response.`},
                {tag: `Internal Profile Management Error`});
        }

        // If the meta file exists - read to ensure that the name of the default is not null or undefined - this can
        // happen after the profile environment is initialized for the first time.
        if (this.locateExistingProfile(this.constructMetaName())) {
            const meta = this.readMeta(this.constructFullProfilePath(this.constructMetaName()));
            if (meta.defaultProfile == null) {
                this.log.debug(`Setting "${parms.name}" of type "${parms.type}" as the default profile.`);
                this.setDefault(parms.name);
            }
        } else if (parms.updateDefault || this.locateExistingProfile(this.constructMetaName()) == null) {
            this.log.debug(`Setting "${parms.name}" of type "${parms.type}" as the default profile.`);
            this.setDefault(parms.name);
        }

        // Return the save/create response to the caller
        this.log.info(`Save API complete for profile "${parms.name}" of type "${this.profileType}".`);
        return response;
    }

    /**
     * Load a profile from disk. Ensures that the parameters are valid and loads the profile specified by name OR the default profile if
     * requested. If load default is requested, any name supplied is ignored.
     * @template L
     * @param {ILoadProfile} parms - See the interface for details.
     * @returns {Promise<IProfileLoaded>} - The promise that is fulfilled with the response object (see interface for details) or rejected
     * with an Imperative Error.
     * @memberof AbstractProfileManager
     */
    public async load<L extends ILoadProfile>(parms: L): Promise<IProfileLoaded> {
        // Ensure the correct parameters were supplied
        ImperativeExpect.toNotBeNullOrUndefined(parms, `Profile load requested for type "${this.profileType}", but no parameters supplied.`);

        // Set defaults if not present
        parms.loadDefault = (parms.loadDefault == null) ? false : parms.loadDefault;
        parms.failNotFound = (parms.failNotFound == null) ? true : parms.failNotFound;
        parms.loadDependencies = (parms.loadDependencies == null) ? true : parms.loadDependencies;

        // Log the API call
        this.log.info(`Loading profile "${parms.name || "default"}" of type "${this.profileType}"...`);

        // If load default is true, avoid the name check - if loading the default, we ignore the name
        if (!parms.loadDefault) {
            ImperativeExpect.keysToBeDefined(parms, ["name"], `A profile load was requested for type "${this.profileType}", ` +
                `but no profile name was specified.`);
        } else {
            parms.name = this.getDefaultProfileName();
            this.log.debug(`The default profile for type "${this.profileType}" is "${parms.name}".`);

            // If we don't find the default name and we know fail not found is false, then return here
            if (parms.name == null) {
                if (!parms.failNotFound) {
                    return this.failNotFoundDefaultResponse("default was requested");
                } else {
                    this.log.error(`No default profile exists for type "${this.profileType}".`);
                    throw new ImperativeError({msg: `No default profile set for type "${this.profileType}".`});
                }
            } else if (!this.locateExistingProfile(parms.name)) {
                this.log.error(`Default profile "${parms.name}" does not exist for type "${this.profileType}".`);
                throw new ImperativeError({
                    msg: `Your default profile named ${parms.name} does not exist for type ${this.profileType}.\n` +
                        `To change your default profile, run "${ImperativeConfig.instance.rootCommandName} profiles set-default ` +
                        `${this.profileType} <profileName>".`
                });
            }
        }

        // Attempt to protect against circular dependencies - if the load count increases to 2 for the same type/name
        // Then some profile in the chain attempted to re-load this profile.
        const mapKey: string = ProfileUtils.getProfileMapKey(this.profileType, parms.name);
        let count = this.loadCounter.get(mapKey);
        if (count == null) {
            count = 1;
        } else {
            count++;
        }
        this.loadCounter.set(mapKey, count);
        this.log.debug(`Load count for "type_name" key "${mapKey}" is ${count}`);
        if (count >= 2) {
            this.log.error(`Circular dependencies detected in profile "${parms.name}" of type "${this.profileType}".`);
            throw new ImperativeError({
                msg: `A circular profile dependency was detected. Profile "${parms.name}" of type "${this.profileType}" ` +
                    `either points directly to itself OR a dependency of this profile points to this profile.`
            });
        }

        // Invoke the implementation
        let response;
        try {
            this.log.debug(`Invoking the implementation to load profile "${parms.name}" of type "${this.profileType}".`);
            response = await this.loadProfile(parms);
        } catch (e) {
            this.log.error(`Load implementation error: ${e.message}`);
            this.loadCounter.set(mapKey, 0);
            throw e;
        }

        // Reset the load counter
        this.loadCounter.set(mapKey, 0);

        this.log.info(`Load API completed for profile "${parms.name}" of type "${this.profileType}".`);
        return response;
    }

    /**
     * Validate a profile. Includes basic and schema validation. Can be called explicitly, but is also called during
     * loads and saves to protect the integrity of the profiles against the type definitions.
     * @template V
     * @param {IValidateProfile} parms - See the interface for details
     * @returns {Promise<IProfileValidated>} - The promise that is fulfilled with the response object (see interface for details) or rejected
     * with an Imperative Error.
     * @memberof AbstractProfileManager
     */
    public async validate<V extends IValidateProfile>(parms: V): Promise<IProfileValidated> {
        // Ensure that parms are passed
        ImperativeExpect.toNotBeNullOrUndefined(parms, `A request was made to validate a profile ` +
            `(of type "${this.profileType}"), but no parameters were specified.`);

        // Ensure defaults are set
        parms.strict = (parms.strict == null) ? false : parms.strict;

        // Pass the schema to the implementations validate
        const validateParms = JSON.parse(JSON.stringify(parms));
        validateParms.schema = this.profileTypeSchema;

        // Log the API call
        this.log.info(`Validating profile of type "${this.profileType}"...`);

        // Validate the profile object is correct for our usage here - does not include schema validation
        this.validateProfileObject(parms.name, this.profileType, parms.profile);

        // Invoke the implementation
        this.log.trace(`Invoking the profile validation implementation for profile "${parms.name}" of type "${this.profileType}".`);

        const response = await this.validateProfile(validateParms);
        if (response == null) {
            throw new ImperativeError({msg: `The profile manager implementation did NOT return a profile validate response.`},
                {tag: `Internal Profile Management Error`});
        }

        return response;
    }

    /**
     * Merge two profiles together. Useful when updating existing profiles with a few new
     * fields, for example.
     * @param {IProfile} oldProfile - the old profile, fields on this will have lower precedence
     * @param {IProfile} newProfile - the new profile, fields on this will have higher precedence
     * @returns {IProfile} - the merged profile
     */
    public mergeProfiles(oldProfile: IProfile, newProfile: IProfile): IProfile {
        const DeepMerge = require("deepmerge");
        // clone both profiles while merging so that the originals are not modified
        const mergedProfile = DeepMerge(JSON.parse(JSON.stringify(oldProfile)), JSON.parse(JSON.stringify(newProfile)));

        // there can only be one dependency per type,
        // but it's possible that the user only wants to
        // update one of the dependencies, and keep dependencies of other types
        // so we will allow merging of the dependencies field
        // but will double check that no duplicates have been created
        if (mergedProfile.dependencies != null && newProfile.dependencies?.length > 0) {
            const markForDeletionKey = "markedForDelete";
            for (const newDependency of newProfile.dependencies) {
                for (const mergedDependency of mergedProfile.dependencies) {
                    if (mergedDependency.type === newDependency.type &&
                            mergedDependency.name !== newDependency.name) {
                        this.log.debug("Deleting dependency from old profile which was overridden " +
                            "by the new dependency of name %s",
                        newDependency.name);
                        mergedDependency[markForDeletionKey] = true;
                    }
                }
            }
            mergedProfile.dependencies = mergedProfile.dependencies.filter((dependency: IProfileDependency) => {

                return !(dependency as any)[markForDeletionKey];
            });
        }
        // we like the merging functionality for most things, but
        // if we merge array type profile fields, then users will not be able to update array type
        // fields through the CLI. So instead we will take array fields from the new type verbatim
        // we'll use this helper to search through
        const DataObjectParser = require("dataobject-parser");
        const findArrayFields = (property: any, propertyPath: string) => {
            if (Array.isArray(property) && !isString(property)) {
                const newProfileProperty = new DataObjectParser(newProfile).get(propertyPath);

                // does the array type property appear on the newer profile
                if (newProfileProperty != null) {
                    // if so, wipe out the merged array with the value from the newer profile
                    this.log.debug("Replacing array type profile field \"%s\" with new value", propertyPath);
                    new DataObjectParser(mergedProfile).set(propertyPath, newProfileProperty);
                }
            } else if (!isString(property)) {
                for (const childPropertyName of Object.keys(property)) {
                    // object.keys returns array indices as well,
                    // so we won't recursively call our helper if
                    // the property name is just a number
                    const propertyNameIsArrayIndex = /^[0-9]+$/.test(childPropertyName);
                    if (!propertyNameIsArrayIndex) {
                        const newPropertyPath = propertyPath + "." + childPropertyName;
                        this.log.debug("Searching for array properties to replace in the field %s", newPropertyPath);
                        findArrayFields(property[childPropertyName], newPropertyPath);
                    }
                }
            }
        };
        for (const propertyName of Object.keys(mergedProfile)) {
            if (propertyName !== "dependencies") {
                findArrayFields(mergedProfile[propertyName], propertyName);
            }
        }
        return mergedProfile;
    }

    /**
     * Deletes a profile from disk. Ensures that the parameters are correct and removes the profile. If the profile is listed as a dependency of
     * other profiles it will NOT delete the profile unless "rejectIfDependency" is set to false.
     * @template D
     * @param {IDeleteProfile} parms - See the interface for details
     * @returns {Promise<IProfileDeleted>} - The promise that is fulfilled with the response object (see interface for details) or rejected
     * with an Imperative Error.
     * @memberof AbstractProfileManager
     */
    public async delete<D extends IDeleteProfile>(parms: D): Promise<IProfileDeleted> {
        // Validate that the delete parms are valid
        ImperativeExpect.toNotBeNullOrUndefined(parms,
            `A delete was requested for profile type "${this.profileType}", but no parameters were specified.`);
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["name"],
            `A delete was requested for profile type "${this.profileType}", but the name specified is undefined or blank.`);

        // Ensure defaults are set
        parms.rejectIfDependency = parms.rejectIfDependency ?? true;

        // Log the API call
        this.log.info(`Deleting profile "${parms.name}" of type "${this.profileType}"...`);

        // Check if the profile exists before continuing
        if (this.locateExistingProfile(parms.name) == null) {
            const msg: string = `Profile "${parms.name}" of type "${this.profileType}" does not exist.`;
            this.log.error(msg);
            throw new ImperativeError({msg});
        }

        // If specified, reject the delete if this profile is listed as dependency for another profile (of any type)
        if (parms.rejectIfDependency) {
            this.log.trace(`Reject if dependency was specified, loading all profiles to check if "${parms.name}" of type ` +
                `"${this.profileType}" is a dependency.`);
            const allProfiles = await this.loadAll({ noSecure: true });
            this.log.trace(`All profiles loaded (for dependency check).`);
            const flatten = ProfileUtils.flattenDependencies(allProfiles);
            const dependents: IProfile[] = this.isDependencyOf(flatten, parms.name);
            if (dependents.length > 0) {
                let depList: string = "";
                for (const dep of dependents) {
                    depList += ("\n" + `Name: "${dep.name}" Type: "${dep.type}"`);
                }
                const msg: string = `The profile specified for deletion ("${parms.name}" of type ` +
                    `"${this.profileType}") is marked as a dependency for profiles:` + depList;
                throw new ImperativeError({msg});
            }
        }

        this.log.trace(`Invoking implementation to delete profile "${parms.name}" of type "${this.profileType}".`);
        const response = await this.deleteProfile(parms);
        if (response == null) {
            throw new ImperativeError({msg: `The profile manager implementation did NOT return a profile delete response.`},
                {tag: `Internal Profile Management Error`});
        }

        // If the meta file exists - read to check if the name of the default profile is the same as
        // the profile that was deleted. If so, reset it to null.
        if (this.locateExistingProfile(this.constructMetaName())) {
            const meta = this.readMeta(this.constructFullProfilePath(this.constructMetaName()));
            if (meta.defaultProfile === parms.name) {
                this.log.debug(`Profile deleted was the default. Clearing the default profile for type "${this.profileType}".`);
                this.clearDefault();
                response.defaultCleared = true;
            }
        }

        return response;
    }

    /**
     * Update the profile - The action performed is dictacted by the implementation of the Abstract manager.
     * @template U
     * @param {IUpdateProfile} parms - See the interface for details
     * @returns {Promise<IProfileUpdated>} - The promise that is fulfilled with the response object (see interface for details) or rejected
     * with an Imperative Error.
     * @memberof AbstractProfileManager
     */
    public async update<U extends IUpdateProfile>(parms: U): Promise<IProfileUpdated> {
        // Validate the input parameters are correct
        ImperativeExpect.toNotBeNullOrUndefined(parms,
            `An update for a profile of type "${this.profileType}" was requested, but no parameters were specified.`);
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["name"],
            `An update for a profile of type "${this.profileType}" was requested, but no name was specified.`);

        // Log the API call
        this.log.info(`Updating profile "${parms.name}" of type "${this.profileType}"...`);

        // Invoke the implementation
        this.log.trace(`Invoking update profile implementation for profile "${parms.name}" of type "${this.profileType}".`);
        const response = await this.updateProfile(parms);
        if (response == null) {
            throw new ImperativeError({msg: `The profile manager implementation did NOT return a profile update response.`},
                {tag: `Internal Profile Management Error`});
        }

        return response;
    }

    /**
     * Sets the default profile for the profile managers type.
     * @param {string} name - The name of the new default
     * @returns {string} - The response string (or an error is thrown if the request cannot be completed);
     * @memberof AbstractProfileManager
     */
    public setDefault(name: string): string {
        // Log the API call
        this.log.info(`Set default API invoked. Setting "${name}" as default for type "${this.profileType}".`);

        // Construct the path to the profile that we are to set as the default for this type
        const profileLocation: string = this.locateExistingProfile(name);

        // Find the meta profile - it may NOT exists - this is OK - will be created
        let metaFilePath: string = this.locateExistingProfile(this.constructMetaName());

        // Read the meta profile OR construct a new profile if it does NOT exist
        let meta: IMetaProfile<T>;
        if (profileLocation) {
            if (metaFilePath) {
                this.log.trace(`The meta file exists for type "${this.profileType}". Reading meta...`);
                meta = this.readMeta(metaFilePath);
                this.log.trace(`Setting default in the meta file for type ${this.profileType}.`);
                this.setDefaultInMetaObject(meta, name);
            } else {
                this.log.info(`The meta file does NOT exist for type "${this.profileType}", ` +
                    `writing the meta file and default profile ("${name}")`);
                metaFilePath = this.constructFullProfilePath(this.constructMetaName());
                meta = {
                    defaultProfile: name,
                    configuration: this.profileTypeConfiguration
                };
            }

            // Write the meta file to disk
            this.log.info(`Writing the updated meta file to disk. Default: ${meta.defaultProfile}`);
            ProfileIO.writeMetaFile(meta, metaFilePath);
        } else {
            const msg: string = `Cannot update default profile for type "${this.profileType}". ` +
                `The profile name specified ("${name}") does not exist. ` +
                `Please create before attempting to set the default.`;
            this.log.error(msg);
            // The profile name specified does NOT actually exist. This is an error.
            throw new ImperativeError({msg});
        }

        return `Default profile for type "${this.profileType}" set to "${name}".`;
    }

    /**
     * Clears the default profile for the profile managers type.
     * @returns {string} - The response string (or an error is thrown if the request cannot be completed);
     * @memberof AbstractProfileManager
     */
    public clearDefault(): string {
        // Log the API call
        this.log.info(`Clear default API invoked for type "${this.profileType}".`);

        // Find the meta profile - it may NOT exists - this is OK - will be created
        let metaFilePath: string = this.locateExistingProfile(this.constructMetaName());

        // Read the meta profile OR construct a new profile if it does NOT exist
        let meta: IMetaProfile<T>;
        if (metaFilePath) {
            this.log.trace(`The meta file exists for type "${this.profileType}". Reading meta...`);
            meta = this.readMeta(metaFilePath);
            this.log.trace(`Clearing default in the meta file for type ${this.profileType}.`);
            this.setDefaultInMetaObject(meta, null);
        } else {
            this.log.info(`The meta file does NOT exist for type "${this.profileType}", ` +
                `writing the meta file without a default profile`);
            metaFilePath = this.constructFullProfilePath(this.constructMetaName());
            meta = {
                defaultProfile: null,
                configuration: this.profileTypeConfiguration
            };
        }

        // Write the meta file to disk
        this.log.info(`Writing the updated meta file to disk. Default: ${meta.defaultProfile}`);
        ProfileIO.writeMetaFile(meta, metaFilePath);

        return `Default profile for type "${this.profileType}" cleared.`;
    }

    /**
     * Returns the default profile name for this "type" or "undefined" if no default is set.
     * @returns {string} - The default profile name or undefined.
     * @memberof AbstractProfileManager
     */
    public getDefaultProfileName(): string {
        const metaFile: string = this.locateExistingProfile(this.constructMetaName());
        let defaultName: string;
        if (metaFile == null) {
            return undefined;
        }

        let meta: IMetaProfile<T>;
        try {
            meta = this.readMeta(metaFile);
            defaultName = meta.defaultProfile;
        } catch (err) {
            throw new ImperativeError({
                msg: `Error reading "${this.profileType}" meta file: ${err.message}.`,
                additionalDetails: err
            });
        }

        return defaultName;
    }

    /**
     * Load all profiles - the behavior is dictated by the implementation.
     * @abstract
     * @param {ILoadAllProfiles} [parms] - the load parameters - See interface for details
     * @returns {Promise<IProfileLoaded[]>} - The list of profiles when the promise is fulfilled or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    public abstract loadAll(parms?: ILoadAllProfiles): Promise<IProfileLoaded[]>;

    /**
     * Save profile - performs the profile save according to the implementation - invoked when all parameters are valid
     * (according the abstract manager).
     * @protected
     * @abstract
     * @param {ISaveProfile} parms - See interface for details
     * @returns {Promise<IProfileSaved>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract saveProfile(parms: ISaveProfile): Promise<IProfileSaved>;

    /**
     * Save profile - performs the profile load according to the implementation - invoked when all parameters are valid
     * (according the abstract manager).
     * @protected
     * @abstract
     * @param {ILoadProfile} parms - See interface for details
     * @returns {Promise<IProfileLoaded>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract loadProfile(parms: ILoadProfile): Promise<IProfileLoaded>;

    /**
     * Delete profile - performs the profile delete according to the implementation - invoked when all parameters are valid
     * (according the abstract manager).
     * @protected
     * @abstract
     * @param {IDeleteProfile} parms - See interface for details
     * @returns {Promise<IProfileDeleted>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract deleteProfile(parms: IDeleteProfile): Promise<IProfileDeleted>;

    /**
     * Validate profile - performs the profile validation according to the implementation - invoked when all parameters are valid
     * (according the abstract manager).
     * @protected
     * @abstract
     * @param {IValidateProfileWithSchema} parms - See interface for details
     * @returns {Promise<IProfileValidated>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract validateProfile(parms: IValidateProfileWithSchema): Promise<IProfileValidated>;

    /**
     * Update profile - performs the profile update according to the implementation - invoked when all parameters are valid
     * (according the abstract manager).
     * @protected
     * @abstract
     * @param {IUpdateProfile} parms - See interface for details
     * @returns {Promise<IProfileUpdated>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract updateProfile(parms: IUpdateProfile): Promise<IProfileUpdated>;

    /**
     * Load a profiles dependencies - dictacted by the implementation.
     * @protected
     * @abstract
     * @param {string} name - the name of the profile to load dependencies for
     * @param {IProfile} profile - The profile to load dependencies for.
     * @param {boolean} failNotFound - True to fail "not found" errors
     * @returns {Promise<IProfileLoaded[]>} - The promise fulfilled with response or rejected with an ImperativeError.
     * @memberof AbstractProfileManager
     */
    protected abstract loadDependencies(name: string, profile: IProfile, failNotFound: boolean): Promise<IProfileLoaded[]>;

    /**
     * Invokes the profile IO method to delete the profile from disk.
     * @protected
     * @param {string} name - The name of the profile to delete.
     * @returns {string} - The path where the profile was.
     * @memberof AbstractProfileManager
     */
    protected deleteProfileFromDisk(name: string): string {
        const profileFullPath: string = this.locateExistingProfile(name);
        ProfileIO.deleteProfile(name, profileFullPath);
        return profileFullPath;
    }

    /**
     * Performs basic validation of a profile object - ensures that all fields are present (if required).
     * @protected
     * @param name - the name of the profile to validate
     * @param type - the type of profile to validate
     * @param {IProfile} profile - The profile to validate.
     * @memberof AbstractProfileManager
     */
    protected validateProfileObject(name: string, type: string, profile: IProfile) {
        // Throw an error on type mismatch - if the profile manager type does not match the input profile
        ImperativeExpect.toBeEqual(type, this.profileType,
            `The profile passed on the create indicates a type ("${type}") that differs from ` +
            `the type specified on this instance of the profile manager ("${this.profileType}").`);

        // Ensure that the profile name is specified and non-blank
        ImperativeExpect.toBeDefinedAndNonBlank(name, "name",
            `The profile passed does not contain a name (type: "${this.profileType}") OR the name property specified is ` +
            `not of type "string".`);

        // Ensure that the profile name passed does NOT match the meta profile name
        ImperativeExpect.toNotBeEqual(name, this.profileTypeMetaFileName,
            `You cannot specify "${name}" as a profile name. ` +
            `This profile name is reserved for internal Imperative usage.`);


        // Validate the dependencies specification
        if (profile.dependencies != null) {
            ImperativeExpect.keysToBeAnArray(profile, false, ["dependencies"], `The profile passed ` +
                `(name "${name}" of type "${type}") has dependencies as a property, ` +
                `but it is NOT an array (ill-formed)`);

            for (const dep of profile.dependencies) {

                // check for name on the dependency
                ImperativeExpect.keysToBeDefinedAndNonBlank(dep, ["name"], `The profile passed ` +
                    `(name "${name}" of type "${type}") has dependencies as a property, ` +
                    `but an entry does not contain "name".`);

                // check for name on the dependency
                ImperativeExpect.keysToBeDefinedAndNonBlank(dep, ["type"], `The profile passed ` +
                    `(name "${name}" of type "${type}") has dependencies as a property, ` +
                    `but an entry does not contain "type".`);
            }
        }
    }

    /**
     * Validates the profile against the schema for its type and reports and errors located.
     * @protected
     * @param name - the name of the profile to validate
     * @param {IProfile} profile - The profile to validate.
     * @param {boolean} [strict=false] - Set to true to enable the "ban unknown properties" specification of the JSON schema spec. In other words,
     * prevents profiles with "unknown" or "not defined" proeprties according to the schema document.
     * @memberof AbstractProfileManager
     */
    protected validateProfileAgainstSchema(name: string, profile: IProfile, strict = false) {


        // Instance of the validator
        const validator = new SchemaValidator();

        // don't make the user specify this internal field of "dependencies"
        // they specify the dependencies on their profile config object,
        // and the profile manager will construct them there
        const schemaWithDependencies = JSON.parse(JSON.stringify(this.profileTypeSchema)); // copy the schema without modifying
        // const dependencyProperty: IProfileProperty = {
        //   type: "array",
        //   items: {
        //     description: "The dependencies",
        //     type: "object",
        //     properties: {
        //       type: {
        //         description: "The type of dependent profile.",
        //         type: "string"
        //       },
        //       name: {
        //         description: "The name of the dependent profile.",
        //         type: "string"
        //       },
        //     }
        //   }
        // };

        // If strict mode is requested, then we will remove name and type (because they are inserted by the manager) and
        // set the additional properties flag false, which, according to the JSON schema specification, indicates that
        // no unknown properties should be present on the document.
        if (strict || (schemaWithDependencies.additionalProperties != null && schemaWithDependencies.additionalProperties === false)) {
            schemaWithDependencies.additionalProperties = false;
        }

        // TODO - @ChrisB, is this supposed to be commented out?
        // schemaWithDependencies.dependencies = dependencyProperty;
        const results = validator.validate(profile, schemaWithDependencies, {verbose: true});
        if (results.errors.length > 0) {
            let validationErrorMsg: string = `Errors located in profile "${name}" of type "${this.profileType}":\n`;
            for (const validationError of results.errors) {
                // make the error messages more human readable
                const property = validationError.property.replace("instance.", "")
                    .replace(/^instance$/, "profile");
                validationErrorMsg += property + " " + validationError.message + "\n";
            }
            throw new ImperativeError({msg: validationErrorMsg, additionalDetails: results});
        }
    }

    /**
     * Constructs the full path to the profile of the managers "type".
     * @protected
     * @param {string} name - The profile name to construct the path
     * @param {any} [type=this.profileType] - The type - normally the type specified in the manager.
     * @returns {string} - The full profile directory.
     * @memberof AbstractProfileManager
     */
    protected constructFullProfilePath(name: string, type = this.profileType): string {
        return nodePath.resolve(this.profileRootDirectory + "/" + type + "/" + name + AbstractProfileManager.PROFILE_EXTENSION);
    }

    /**
     * Locate the existing profile for the name specified.
     * @protected
     * @param {string} name - The profile to locate
     * @returns {string} - The fully qualified path or undefined if not found.
     * @memberof AbstractProfileManager
     */
    protected locateExistingProfile(name: string): string {
        const path: string = this.constructFullProfilePath(name);
        return ProfileIO.exists(path);
    }

    /**
     * Standard load failed error message and Imperative Error.
     * @protected
     * @param {string} name - The name of the profile for which the load failed.
     * @memberof AbstractProfileManager
     */
    protected loadFailed(name: string) {
        throw new ImperativeError({
            msg: `Profile "${name}" of type "${this.profileType}" does not exist.`
        });
    }

    /**
     * Checks if the profile object passed is "empty" - meaning it has no contents other than that type or name.
     * A profile can only specify "dependencies", in the event that it is just acting as a "pointer" to another profile.
     * @protected
     * @param {IProfile} profile - The profile to check for "emptiness".
     * @returns {boolean} True if the profile object is empty.
     * @memberof AbstractProfileManager
     */
    protected isProfileEmpty(profile: IProfile): boolean {
        for (const key in profile) {
            if (key === "type" || key === "name") {
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(profile, key)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Loads a specific profile (by name).
     * @protected
     * @param {string} name - The name of the profile to load.
     * @param {boolean} [failNotFound=true] - Specify false to ignore "not found" errors.
     * @param {boolean} [loadDependencies=true] - Specify false to NOT load dependencies.
     * @returns {Promise<IProfileLoaded>} - The promise to fulfill with the response OR reject with an ImperativeError
     * @memberof AbstractProfileManager
     */
    protected async loadSpecificProfile(name: string, failNotFound: boolean = true, loadDependencies: boolean = true): Promise<IProfileLoaded> {
        // Ensure that the profile actually exists
        const profileFilePath: string = this.locateExistingProfile(name);

        // If it doesn't exist and fail not found is false
        if (profileFilePath == null && !failNotFound) {
            return this.failNotFoundDefaultResponse(name);
        }

        // Throw an error indicating that the load failed
        if (profileFilePath == null) {
            this.loadFailed(name);
        }

        // Load the profile from disk
        const profileContents = ProfileIO.readProfileFile(profileFilePath, this.profileType);

        // Insert the name and type - not persisted on disk

        try {
            await this.validate({name, profile: profileContents});
        } catch (e) {
            throw new ImperativeError({
                msg: `Profile validation error during load of profile "${name}" ` +
                    `of type "${this.profileType}". Error Details: ${e.message}`,
                additionalDetails: e
            });
        }

        // Construct the load response for this profile.
        const loadResponse: IProfileLoaded = {
            message: `Profile "${name}" of type "${this.profileType}" loaded successfully.`,
            profile: profileContents,
            type: this.profileType,
            name,
            failNotFound,
            dependenciesLoaded: false,
            dependencyLoadResponses: []
        };

        // If requested, load the profile's dependencies
        if (loadDependencies) {
            const loadDependenciesResponse = await this.loadDependencies(name, profileContents, failNotFound);
            if (loadDependenciesResponse?.length > 0) {
                loadResponse.dependenciesLoaded = true;
                loadResponse.dependencyLoadResponses = loadDependenciesResponse;
            }
        }

        // Return the profile and dependencies to caller
        return loadResponse;
    }

    /**
     * Validates a profiles contents against the required dependencies specified on the profile configuration type document. If the document
     * indicates that a dependency is required and that dependency is missing from the input profile, an error is thrown.
     * @private
     * @param {IProfile} profile - The profile to validate dependency specs
     * @memberof AbstractProfileManager
     */
    protected validateRequiredDependenciesAreSpecified(profile: IProfile) {
        if (this.profileTypeConfiguration.dependencies?.length > 0) {
            const specifiedDependencies = profile.dependencies || [];
            for (const dependencyConfig of this.profileTypeConfiguration.dependencies) {
                // are required dependencies present in the profile?
                if (dependencyConfig.required) {
                    let requiredDependencyFound = false;
                    for (const specifiedDependency of specifiedDependencies) {
                        if (specifiedDependency.type === dependencyConfig.type) {
                            requiredDependencyFound = true;
                        }
                    }
                    if (!requiredDependencyFound) {
                        throw new ImperativeError({
                            msg: `Profile type "${this.profileType}" specifies a required dependency of type "${dependencyConfig.type}" ` +
                                `on the "${this.profileType}" profile type configuration document. A dependency of type "${dependencyConfig.type}" ` +
                                `was NOT listed on the input profile.`
                        });
                    }
                }
            }
        }
    }


    /**
     * Checks if the profile (by name) is listed as a dependency of any other profile passed. The type of the profiled named is
     * the type of the current manager object.
     * @private
     * @param {IProfileLoaded[]} profilesToSearch - The list of profiles to search for the dependency.
     * @param {string} name
     * @returns {IProfile[]}
     * @memberof AbstractProfileManager
     */
    private isDependencyOf(profilesToSearch: IProfileLoaded[], name: string): IProfile[] {
        const foundAsDependencyIn: IProfile[] = [];
        for (const prof of profilesToSearch) {
            if (prof.profile.dependencies != null) {
                for (const dep of prof.profile.dependencies) {
                    if (name === dep.name && this.profileType === dep.type) {
                        foundAsDependencyIn.push(prof);
                    }
                }
            }
        }
        return foundAsDependencyIn;
    }

    /**
     * Protects a against an overwrite on a profile save (if requested).
     * @private
     * @param {string} name - The name of the profile to check for existance.
     * @param {boolean} overwrite - False to protect against overwrite.
     * @memberof AbstractProfileManager
     */
    private protectAgainstOverwrite(name: string, overwrite: boolean) {
        const file: string = this.locateExistingProfile(name);
        if (file != null) {
            if (!overwrite) {
                const errMsg: string = `Profile "${name}" of type "${this.profileType}" already ` +
                    `exists and overwrite was NOT specified.`;
                throw new ImperativeError({
                    msg: errMsg,
                });
            }
        }
    }

    /**
     * Builds the meta profile name for this type. Normally of the form "<type>_meta". This method does NOT include the extension
     * @private
     * @param {any} [type=this.profileType] - The profile type - defaults to this manager's type.
     * @returns {string}
     * @memberof AbstractProfileManager
     */
    private constructMetaName(type = this.profileType): string {
        return type + AbstractProfileManager.META_FILE_SUFFIX;
    }

    /**
     * Create's the directory for this profile manager's type.
     * @private
     * @returns {string} - The directory created
     * @memberof AbstractProfileManager
     */
    private createProfileTypeDirectory(): string {
        const profilePath: string = this.profileRootDirectory + "/" + this.profileType;
        if (!ProfileIO.exists(profilePath)) {
            ProfileIO.createProfileDirs(profilePath);
        }
        return profilePath + "/";
    }

    /**
     * Set the default profile name in the meta profile for this type.
     * @private
     * @param {IMetaProfile<T>} meta - The meta profile contents.
     * @param {string} defaultProfileName - The name to set as default.
     * @memberof AbstractProfileManager
     */
    private setDefaultInMetaObject(meta: IMetaProfile<T>, defaultProfileName: string) {
        meta.defaultProfile = defaultProfileName;
    }

    /**
     * Construct the default response for the situation when a profile is not found (on a load/save/update/etc), but ignore not found is true.
     * @private
     * @param {string} name - The name of the profile that was not found
     * @returns {IProfileLoaded} - The default response.
     * @memberof AbstractProfileManager
     */
    private failNotFoundDefaultResponse(name: string): IProfileLoaded {
        this.log.debug(`Profile "${name}" of type "${this.profileType}" was not found, but failNotFound=False`);
        return {
            message: `Profile "${name}" of type "${this.profileType}" was not found, but the request indicated to ignore "not found" errors. ` +
                `The profile returned is undefined.`,
            type: this.profileType,
            name,
            failNotFound: false,
            dependenciesLoaded: false,
            dependencyLoadResponses: []
        };
    }

    /**
     * Reads all configuration documents from the meta and collects all type configuration documents.
     * @private
     * @returns {T[]}
     * @memberof AbstractProfileManager
     */
    private collectAllConfigurations(): T[] {
        const configs: T[] = [];
        const types: string[] = ProfileIO.getAllProfileDirectories(this.profileRootDirectory);
        for (const type of types) {
            const meta = this.readMeta(this.constructFullProfilePath(this.constructMetaName(type), type));
            configs.push(meta.configuration);
        }
        return configs;
    }

    /**
     * Validate that the schema document passed is well formed for the profile manager usage. Ensures that the
     * schema is not overloading reserved properties.
     * @private
     * @param {IProfileSchema} schema - The schema document to validate.
     * @param type - the type of profile for the schema - defaults to the current type for this manager
     * @memberof AbstractProfileManager
     */
    private validateSchema(schema: IProfileSchema, type = this.profileType) {
        ImperativeExpect.keysToBeDefined(schema, ["properties"], `The schema document supplied for the profile type ` +
            `("${type}") does NOT contain properties.`);
        ImperativeExpect.keysToBeUndefined(schema, ["properties.dependencies"], `The schema "properties" property ` +
            `(on configuration document for type "${type}") contains "dependencies". ` +
            `"dependencies" is must be supplied as part of the "type" configuration document (no need to formulate the dependencies ` +
            `schema yourself).`);
    }

    /**
     * Validates the basic configuration document to ensure it contains all the proper fields
     * @private
     * @param {T} typeConfiguration - The type configuration document
     * @memberof AbstractProfileManager
     */
    private validateConfigurationDocument(typeConfiguration: T) {
        ImperativeExpect.keysToBeDefinedAndNonBlank(typeConfiguration, ["type"], `The profile type configuration document for ` +
            `"${typeConfiguration.type}" does NOT contain a type.`);
        ImperativeExpect.keysToBeDefined(typeConfiguration, ["schema"], `The profile type configuration document for ` +
            `"${typeConfiguration.type}" does NOT contain a schema.`);
        this.validateSchema(typeConfiguration.schema, typeConfiguration.type);
        if (typeConfiguration.dependencies != null) {
            ImperativeExpect.toBeAnArray(typeConfiguration.dependencies,
                `The profile type configuration for "${typeConfiguration.type}" contains a "dependencies" property, ` +
                `but it is not an array (ill-formed)`);
            for (const dep of typeConfiguration.dependencies) {
                ImperativeExpect.keysToBeDefinedAndNonBlank(dep, ["type"], "A dependency specified for the " +
                    "profile definitions did not contain a type.");
            }
        }
    }

    /**
     * Validate that a meta profile (one read from disk in particular) is valid.
     * @private
     * @param {IMetaProfile<T>} meta - The meta profile to validate
     * @param {string} [type=this.profileType] - The profile type of this meta file.
     * @memberof AbstractProfileManager
     */
    private validateMetaProfile(meta: IMetaProfile<T>, type = this.profileType) {
        ImperativeExpect.keysToBeDefined(meta, ["configuration"], `A meta profile of type "${type}", does NOT supply a configuration.`);
        // ImperativeExpect.keysToBeDefined(meta, ["defaultProfile"], `A meta profile of type "${type}", does NOT supply a default profile.`);
    }

    /**
     * Read the meta profile and validate the contents.
     * @private
     * @param {string} path - path to the meta profile
     * @param {string} [type=this.profileType] - The profile type
     * @returns {IMetaProfile<T>} - The meta profile read from disk.
     * @memberof AbstractProfileManager
     */
    private readMeta(path: string, type = this.profileType): IMetaProfile<T> {
        const meta = ProfileIO.readMetaFile<T>(path);
        this.validateMetaProfile(meta);
        return meta;
    }
}
