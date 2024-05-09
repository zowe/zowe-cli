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

import {
    BasicProfileManager,
    IProfile,
    IProfileManager,
    IProfileSaved,
    IProfileUpdated,
    IProfileValidated,
    ISaveProfileFromCliArgs,
    IUpdateProfileFromCliArgs,
    IValidateProfileForCLI,
    ProfilesConstants,
    ProfileUtils
} from "../../../profiles";
import { inspect } from "util";
import { ImperativeError } from "../../../error";
import { Arguments } from "yargs";
import { CommandResponse } from "../response/CommandResponse";
import { ICommandHandlerRequire } from "../doc/handler/ICommandHandlerRequire";
import { ICommandHandler } from "../../src/doc/handler/ICommandHandler";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import { CommandProfiles } from "./CommandProfiles";
import { ICommandProfileProperty } from "../doc/profiles/definition/ICommandProfileProperty";
import { CredentialManagerFactory } from "../../../security";
import { IDeleteProfile, IProfileDeleted, IProfileLoaded } from "../../../profiles/src/doc";
import { SecureOperationFunction } from "../types/SecureOperationFunction";
import { ICliLoadProfile } from "../doc/profiles/parms/ICliLoadProfile";
import { ICliLoadAllProfiles } from "../doc/profiles/parms/ICliLoadAllProfiles";
import { CliUtils } from "../../../utilities/src/CliUtils";

/**
 * A profile management API compatible with transforming command line arguments into
 * profiles
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

    /**
     * Overridden saveProfile functionality.
     * If CLI args are provided, profile fields are built from the args.
     * Otherwise BaseProfileManager functionality is used.
     * @param {ISaveProfileFromCliArgs} parms - parameters for the save, potentially including CLI args
     * @returns {Promise<IProfileSaved>} - promise which fulfills with the save results
     */
    protected async saveProfile(parms: ISaveProfileFromCliArgs): Promise<IProfileSaved> {
        // If the arguments are present, build the new profile from the arguments
        // Otherwise, just save the profile passed.
        this.log.trace("Cli save profile entered");
        const validationParms: IValidateProfileForCLI = JSON.parse(JSON.stringify(parms));
        validationParms.readyForValidation = true;

        if (parms.args != null) {
            this.log.trace(`Arguments supplied, constructing profile from arguments:\n${inspect(parms.args, {depth: null})}`);
            parms.profile = await this.createProfileFromCommandArguments(parms.args, parms.profile);

            validationParms.profile = parms.profile;
            delete parms.args;
            this.log.debug(`Validating profile build (name: ${parms.name}).`);
            await this.validate(validationParms); // validate now that the profile has been built
        } else {
            // profile should already be ready
            this.log.trace("No arguments specified, performing the basic validation (schema, etc.).");
            await this.validate(validationParms);
        }
        parms.profile = await this.processSecureProperties(parms.name, parms.profile);
        return super.saveProfile(parms);
    }

    /**
     * Overridden updateProfile functionality
     * If CLI args are provided, profile fields are built from the arguments. Otherwise
     * the BaseProfileManager update functionality is used
     *
     * @param {IUpdateProfileFromCliArgs} parms - parameters, potentially including CLI args
     * @returns {Promise<IProfileUpdated>} - promise which contains the updated profile, path, and message
     *                                       when fulfilled
     */
    protected async updateProfile(parms: IUpdateProfileFromCliArgs): Promise<IProfileUpdated> {
        // If there are arguments present, then it is assumed that we want to update from the args,
        // otherwise we will invoke the default updateProfile which assumes that the profile update
        // has already been constructed and just needs to be saved.
        // When updating from the args, we do not need to run validation twice when saving the profile
        let updated: any;
        if (parms.args != null) {
            const newManagerParams: IProfileManager<ICommandProfileTypeConfiguration> = JSON.parse(JSON.stringify(this.managerParameters));
            newManagerParams.loadCounter = this.loadCounter;
            newManagerParams.logger = this.log;
            const loadedProfile = await new CliProfileManager(newManagerParams).loadProfile({name: parms.name});
            updated = await this.updateProfileFromCliArgs(parms, loadedProfile.profile,
                (parms.profile == null) ? {} : parms.profile);
            delete parms.args;
            this.log.debug("Profile \"%s\" of type \"%s\" has been updated from CLI arguments. " +
                "Validating the structure of the profile.", parms.name, this.profileType);
        } else {
            updated = await super.updateProfile(parms);
            this.log.debug("No CLI args were provided. Used the BasicProfileManager update API");

            const validationParms: IValidateProfileForCLI = JSON.parse(JSON.stringify(parms));
            validationParms.readyForValidation = true;
            validationParms.profile = updated.profile;
            await this.validateProfile(validationParms);
        }

        return updated;
    }

    /**
     * Overridden loadProfile functionality
     * After the BasicProfileManager loads the profile, we process the secured properties for the CLi to use
     *
     * @param {ICliLoadProfile} parms - Load control params - see the interface for full details
     * @returns {Promise<IProfileLoaded>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     */
    protected async loadProfile(parms: ICliLoadProfile): Promise<IProfileLoaded> {
        const loadedProfile = await super.loadProfile(parms);
        const profile = loadedProfile.profile;

        // If noSecure is specified, skip secure loading
        let securelyLoadValue: SecureOperationFunction;
        if (!parms.noSecure && CredentialManagerFactory.initialized) {
            /**
             * Securely load a property associated with a given profile
             * @param {string} propertyNamePath - The path to the property
             * @return {Promise<string>}
             */
            securelyLoadValue = async (propertyNamePath: string, _: any, optional?: boolean): Promise<any> => {
                let ret;
                try {
                    this.log.debug(
                        `Loading secured field with key ${propertyNamePath} for profile` +
                        ` ("${parms.name}" of type "${this.profileType}").`
                    );
                    // Use the Credential Manager to store the credentials
                    ret = await CredentialManagerFactory.manager.load(
                        ProfileUtils.getProfilePropertyKey(this.profileType, parms.name, propertyNamePath),
                        optional
                    );
                } catch (err) {
                    this.log.error(
                        `Unable to load secure field "${propertyNamePath}" ` +
                        `associated with profile "${parms.name}" of type "${this.profileType}".`
                    );

                    let additionalDetails: string = err.message + (err.additionalDetails ? `\n${err.additionalDetails}` : "");
                    additionalDetails = this.addProfileInstruction(additionalDetails);

                    this.log.error(`Error: ${additionalDetails}`);
                    if (err.causeErrors != null) {
                        this.log.error("Cause errors: " + inspect(err.causeErrors));
                    }
                    throw new ImperativeError({
                        msg: `Unable to load the secure field "${propertyNamePath}" associated with ` +
                            `the profile "${parms.name}" of type "${this.profileType}".`,
                        additionalDetails,
                        causeErrors: err
                    });
                }

                return (ret != null) ? JSON.parse(ret) : undefined; // Parse it after loading it. We stringify-ed before saving it
            };
        }

        if (profile != null) {
            for (const prop of Object.keys(this.profileTypeConfiguration.schema.properties)) {
                profile[prop] = await this.findOptions(this.profileTypeConfiguration.schema.properties[prop], prop, profile[prop], securelyLoadValue);
            }
        }

        // Return the loaded profile
        loadedProfile.profile = profile || {};
        return loadedProfile;
    }

    /**
     * Overridden loadProfile functionality
     * Before the BasicProfileManager deletes the profile, we remove the secure properties associated with the profile
     *
     * @param {IDeleteProfile} parms - Delete control params - see the interface for full details
     * @returns {Promise<IProfileDeleted>} - Promise that is fulfilled when complete (or rejected with an Imperative Error)
     */
    protected async deleteProfile(parms: IDeleteProfile): Promise<IProfileDeleted> {

        // If the credential manager is null, we are using plain text
        let deleteSecureProperty: SecureOperationFunction;
        if (CredentialManagerFactory.initialized) {
            /**
             * Delete a secure property associated with a given profile
             * @param {string} propertyNamePath - The path to the property
             * @return {Promise<string>}
             */
            deleteSecureProperty = async (propertyNamePath: string): Promise<void> => {
                try {
                    this.log
                        .debug(`Deleting secured field with key ${propertyNamePath} for profile ("${parms.name}" of type "${this.profileType}").`);
                    // Use the Credential Manager to store the credentials
                    await CredentialManagerFactory.manager.delete(
                        ProfileUtils.getProfilePropertyKey(this.profileType, parms.name, propertyNamePath)
                    );
                } catch (err) {
                    this.log.error(`Unable to delete secure field "${propertyNamePath}" ` +
                        `associated with profile "${parms.name}" of type "${this.profileType}".`);

                    let additionalDetails: string = err.message + (err.additionalDetails ? `\n${err.additionalDetails}` : "");
                    additionalDetails = this.addProfileInstruction(additionalDetails);
                    this.log.error(`Error: ${additionalDetails}`);

                    throw new ImperativeError({
                        msg: `Unable to delete the secure field "${propertyNamePath}" associated with ` +
                            `the profile "${parms.name}" of type "${this.profileType}".`,
                        additionalDetails,
                        causeErrors: err
                    });
                }
            };
        }

        for (const prop of Object.keys(this.profileTypeConfiguration.schema.properties)) {
            await this.findOptions(this.profileTypeConfiguration.schema.properties[prop], prop, null, deleteSecureProperty);
        }

        return super.deleteProfile(parms);
    }

    /**
     * Validate a profile's structure, skipping the validation if we haven't built the
     * profile's fields from the CLI arguments yet.
     * @param {IValidateProfileForCLI} parms - validate profile parameters. if these don't
     *                                         have readyForValidation = true, validation is
     *                                         skipped
     * @returns {Promise<IProfileValidated>}
     */
    protected async validateProfile(parms: IValidateProfileForCLI): Promise<IProfileValidated> {
        if (parms.readyForValidation) {
            this.log.debug(`Invoking the basic profile manager validate for profile: "${parms.name}"`);
            return super.validateProfile(parms);
        } else {
            this.log.trace(`Skipping the validate for profile (as it's being built): "${parms.name}"`);
            return {message: "Skipping validation until profile is built"};
        }
    }

    /**
     * After the DefaultCredentialManager reports an error resolution of recreating
     * a credential, add instruction to recreate the profile.
     *
     * @param {String} errDetails - The additional details of an error thrown
     *      by DefaultCredentialManager.
     *
     * @returns {string} An error details string that contains an instruction to
     *      recreate the profile (when appropriate).
     */
    private addProfileInstruction(errDetails: string): string {
        const recreateCredText: string = "Recreate the credentials in the vault";
        const recreateProfileText: string =
            "  To recreate credentials, issue a 'profiles create' sub-command with the --ow flag.\n";
        if (errDetails.includes(recreateCredText)) {
            errDetails += recreateProfileText;
        } else {
            const additionalDetails = CredentialManagerFactory.manager.secureErrorDetails();
            if (additionalDetails != null) {
                errDetails += "\n\n" + additionalDetails;
            }
        }
        return errDetails;
    }

    /**
     * Helper routine to find nested properties
     * Inspired by the inner function of insertCliArgumentsIntoProfile
     *
     * @param {ICommandProfileProperty} prop - profile property
     * @param {string} propNamePath - Dot notation path of a property (e.g. my.nested.property)
     * @param {*} propValue - Current value of the property while traversing down the object tree
     * @param {SecureOperationFunction} secureOp - Function to be executed if we are supposed to process secure properties
     * @returns {Promise<any>} Processed version of a property
     */
    private async findOptions(prop: ICommandProfileProperty, propNamePath: string, propValue: any, secureOp?: SecureOperationFunction): Promise<any> {
        if (prop.optionDefinition != null) {
            // once we reach a property with an option definition,
            // we now have the complete path to the property
            // so we will set the value on the property from the profile
            const optionName = prop.optionDefinition.name;
            this.log.debug("Setting profile field %s from command line option %s", propNamePath, optionName);
            if (secureOp && prop.secure) {
                this.log.debug("Performing secure operation on property %s", propNamePath);
                return secureOp(propNamePath, propValue, !prop.optionDefinition.required);
            }
            return Promise.resolve(propValue);
        }
        if (prop.properties != null) {
            if (secureOp && prop.secure) {
                if (!propValue || Object.keys(propValue).length === 0) { // prevents from performing operations on empty objects
                    return Promise.resolve(null);
                }

                this.log.debug("Performing secure operation on property %s", propNamePath);
                return secureOp(propNamePath, propValue);
            }
            const tempProperties: any = {};
            for (const childPropertyName of Object.keys(prop.properties)) {
                tempProperties[childPropertyName] =
                    await this.findOptions(
                        prop.properties[childPropertyName],
                        propNamePath + "." + childPropertyName,
                        ((propValue != null) && (propValue[childPropertyName] != null)) ?
                            JSON.parse(JSON.stringify(propValue[childPropertyName])) : null,
                        secureOp
                    );
            }
            return Promise.resolve(tempProperties);
        }

        return Promise.resolve(propValue);
    }

    /**
     * Process and store all secure properties and replace them with a constant for display purposes
     * @param name - the name of the profile with which the secure properties are associated
     * @param {IProfile} profile - Profile contents to be processed
     * @return {Promise<IProfile>}
     */
    private async processSecureProperties(name: string, profile: IProfile): Promise<IProfile> {
        // If the credential manager is null, skip secure props and the profile will default to plain text
        let securelyStoreValue: SecureOperationFunction;
        if (CredentialManagerFactory.initialized) {
            /**
             * Securely store a property associated with a given profile
             * @param {string} propertyNamePath - The path to the property
             * @param {string} propertyValue - The value associated with the given profile property
             * @return {Promise<string>}
             */
            securelyStoreValue = async (propertyNamePath: string, propertyValue: string): Promise<string> => {
                if (propertyValue == null) {
                    // don't store null values but still remove value that may have been stored previously
                    this.log.debug(`Deleting secured field with key ${propertyNamePath}` +
                        ` for profile (of type "${this.profileType}").`);

                    // In this particular case, do not throw an error if delete doesn't work.
                    try {
                        await CredentialManagerFactory.manager.delete(
                            ProfileUtils.getProfilePropertyKey(this.profileType, name, propertyNamePath)
                        );
                    } catch (err) {
                        // If delete did not work here, it is probably okay.
                    }

                    return undefined;
                }
                try {
                    this.log.debug(`Associating secured field with key ${propertyNamePath}` +
                        ` for profile (of type "${this.profileType}").`);
                    // Use the Credential Manager to store the credentials
                    await CredentialManagerFactory.manager.save(
                        ProfileUtils.getProfilePropertyKey(this.profileType, name, propertyNamePath),
                        JSON.stringify(propertyValue) // Stringify it before saving it. We will parse after loading it
                    );
                } catch (err) {
                    this.log.error(`Unable to store secure field "${propertyNamePath}" ` +
                        `associated with profile "${name}" of type "${this.profileType}".`);

                    let additionalDetails: string = err.message + (err.additionalDetails ? `\n${err.additionalDetails}` : "");
                    additionalDetails = this.addProfileInstruction(additionalDetails);
                    this.log.error(`Error: ${additionalDetails}`);

                    throw new ImperativeError({
                        msg: `Unable to store the secure field "${propertyNamePath}" associated with ` +
                            `the profile "${name}" of type "${this.profileType}".`,
                        additionalDetails,
                        causeErrors: err
                    });
                }

                // The text in the profile will read "managed by <credential manager name>"
                return `${ProfilesConstants.PROFILES_OPTION_SECURELY_STORED} ${CredentialManagerFactory.manager.name}`;
            };
        }

        for (const prop of Object.keys(this.profileTypeConfiguration.schema.properties)) {
            profile[prop] = await this.findOptions(this.profileTypeConfiguration.schema.properties[prop], prop, profile[prop], securelyStoreValue);
        }

        return profile;
    }

    /**
     * Update an existing profile with arguments from the user based on
     * the schema and configuration for this profile type
     * @param {IUpdateProfileFromCliArgs} parms - parameters including args
     * @param {IProfile} oldProfile - the pre-existing profile to update
     * @param {IProfile} newProfile - new profile which will have fields set from CLI args
     * @returns {Promise<IProfileUpdated>}  promise which provides the finished profile on fulfill
     */
    private async updateProfileFromCliArgs(parms: IUpdateProfileFromCliArgs, oldProfile: IProfile, newProfile: IProfile): Promise<IProfileUpdated> {
        // Create the modified profile from the CLI arguments
        const updatedProfile = await this.updateProfileFieldsFromCommandArguments(oldProfile, newProfile, parms.args, parms.merge);
        // Save the profile (basically just overwrites the old profile)
        let createResponse: IProfileSaved;
        try {
            this.log.info("Saving updated profile \"%s\" of type \"%s\"",
                parms.name, this.profileType);
            createResponse = await this.saveProfile({
                name: parms.name,
                type: this.profileType,
                profile: updatedProfile,
                updateDefault: false,
                overwrite: true,
            });
        } catch (saveErr) {
            throw new ImperativeError({
                msg: `An error occurred while saving the modified profile ` +
                    `("${parms.name}" of type "${this.profileType}"): ${saveErr.message}`
            });
        }

        // Return the success response
        return {
            profile: updatedProfile,
            path: createResponse.path,
            message: `Profile "${parms.name}" of type "${this.profileType}" successfully updated from command line arguments.`
        };
    }

    /**
     *
     * If a custom handler is provided for update, the handler will be loaded and invoked
     * in order to build the finished profile
     * @param {IProfile} oldProfile - the old profile to update
     * @param newProfile - new profile which may have fields populated, which will be updated from the CLI args
     * @param {yargs.Arguments} newArguments - CLi arguments specified by the user
     * @param merge - should the profiles be merged? (will be skipped if there is a custom update profile handler)
     * @returns {Promise<IProfile>} - promise which provides the finished profile on fulfill
     */
    private async updateProfileFieldsFromCommandArguments(oldProfile: IProfile, newProfile: IProfile, newArguments: Arguments,
        merge: boolean): Promise<IProfile> {
        const profileConfig = this.profileTypeConfiguration;
        if (profileConfig.updateProfileFromArgumentsHandler != null) {
            // if there is a custom update profile handler, they can call mergeProfile
            // from their handler, so we will not do it for them to avoid issues
            this.log.debug("Loading custom update profile handler: " + profileConfig.updateProfileFromArgumentsHandler);
            const response = new CommandResponse({silent: true});
            let handler: ICommandHandler;
            try {
                const commandHandler: ICommandHandlerRequire = require(profileConfig.updateProfileFromArgumentsHandler);
                handler = new commandHandler.default();
            } catch (e) {
                const errorMessage = this.log.error(`Error encountered loading custom update profile handler ` +
                    `${profileConfig.updateProfileFromArgumentsHandler}:\n` + +e.message);
                throw new ImperativeError(
                    {
                        msg: errorMessage,
                        causeErrors: [e],
                        stack: e.stack
                    });
            }
            try {
                await handler.process({
                    arguments: CliUtils.buildBaseArgs(newArguments),
                    positionals: newArguments._,
                    response,
                    fullDefinition: undefined,
                    definition: undefined,
                    profiles: new CommandProfiles(new Map<string, IProfile[]>()),
                    stdin: process.stdin
                });
            } catch (invokeErr) {
                const errorMessage = this.log.error(`Error encountered updating profile of type ${this.profileType} ` +
                    ` with custom update profile handler ` +
                    `("${profileConfig.updateProfileFromArgumentsHandler}"):` +
                    invokeErr.message);
                throw new ImperativeError(
                    {
                        msg: errorMessage,
                        causeErrors: [invokeErr],
                        stack: invokeErr.stack
                    });
            }

            // zeroth response object is specified to be
            // the finalized profile
            const finishedProfile = response.buildJsonResponse().data;
            this.insertDependenciesIntoProfileFromCLIArguments(newArguments, finishedProfile);
            return finishedProfile;
        } else {
            this.log.debug("No custom update profile handler was specified. Building profile from CLI arguments");
            await this.insertCliArgumentsIntoProfile(newArguments, newProfile);
            if (merge) {
                this.log.debug("Merging new profile created from CLI arguments with existing profile");
                newProfile = this.mergeProfiles(oldProfile, newProfile);
            }
            return newProfile;
        }
    }

    /**
     * Take command line arguments from the user and create a profile from them using the schema and configuration for
     * the profile type
     * @param {yargs.Arguments} profileArguments - CLI arguments specified by the user
     * @param {IProfile} starterProfile - the profile with name and type to use to start the profile creation
     * @returns {Promise<IProfile>} profile which provides the finished profile on fulfill
     */
    private async createProfileFromCommandArguments(profileArguments: Arguments, starterProfile: IProfile): Promise<IProfile> {
        const profileConfig = this.profileTypeConfiguration;
        if (profileConfig.createProfileFromArgumentsHandler != null) {
            const response = new CommandResponse({silent: true, args: profileArguments});
            let handler: ICommandHandler;
            try {
                const commandHandler: ICommandHandlerRequire = require(profileConfig.createProfileFromArgumentsHandler);
                handler = new commandHandler.default();
            } catch (e) {
                const errorMessage = this.log.error(`Error encountered loading custom create profile handler ` +
                    `${profileConfig.createProfileFromArgumentsHandler}:\n` + +e.message);
                throw new ImperativeError(
                    {
                        msg: errorMessage,
                        causeErrors: [e],
                        stack: e.stack
                    });
            }
            try {
                await handler.process({
                    arguments: CliUtils.buildBaseArgs(profileArguments),
                    positionals: profileArguments._,
                    response,
                    fullDefinition: undefined,
                    definition: undefined,
                    profiles: new CommandProfiles(new Map<string, IProfile[]>()),
                    stdin: process.stdin
                });
            } catch (invokeErr) {
                const errorMessage = this.log.error("Error encountered building new profile with custom create profile handler:" + invokeErr.message);
                throw new ImperativeError(
                    {
                        msg: errorMessage,
                        causeErrors: [invokeErr],
                        stack: invokeErr.stack
                    });
            }

            // zeroth response object is specified to be
            // the finalized profile
            const finishedProfile = response.buildJsonResponse().data;
            this.insertDependenciesIntoProfileFromCLIArguments(profileArguments, finishedProfile);

            return finishedProfile;
        } else {
            const profile: IProfile = {};
            // default case - no custom handler
            // build profile object directly from command arguments
            await this.insertCliArgumentsIntoProfile(profileArguments, profile);
            this.insertDependenciesIntoProfileFromCLIArguments(profileArguments, profile);
            return profile;
        }
    }

    /**
     * Default style of building of profile fields to option definitions defined in the schema
     * Will only work if there is a one-to-one option definition mapping for schema fields
     * @param {yargs.Arguments} args - the arguments specified by the user
     * @param {IProfile} profile -  the profile so far, which will be updated
     */
    private async insertCliArgumentsIntoProfile(args: Arguments, profile: IProfile): Promise<void> {
        /**
         * Helper routine to find nested properties
         * @param {Object} property - profile property
         * @param {ICommandProfileProperty} property - profile property
         * @param {string} propertyNamePath - Dot notation path of a property (e.g. my.nested.property)
         */
        const findOptions = async (property: ICommandProfileProperty, propertyNamePath: string): Promise<any> => {
            if (property.optionDefinition != null) {
                // once we reach a property with an option definition,
                // we now have the complete path to the property
                // so we will set the value on the property from the profile
                this.log.debug("Setting profile field %s from command line option %s", propertyNamePath, property.optionDefinition.name);
                return args[property.optionDefinition.name];
            }

            if (property.properties != null) {
                const tempProperties: any = {};
                for (const childPropertyName of Object.keys(property.properties)) {
                    tempProperties[childPropertyName] =
                        await findOptions(property.properties[childPropertyName], propertyNamePath + "." + childPropertyName);
                }
                return tempProperties;
            }

            // Don't define any value here if the profile field cannot be set by a CLI option
            return undefined;
        };

        for (const propertyName of Object.keys(this.profileTypeConfiguration.schema.properties)) {
            profile[propertyName] =
                await findOptions(this.profileTypeConfiguration.schema.properties[propertyName], propertyName);
        }
    }

    /**
     * Build the "dependencies" field of a profile object from command line arguments
     * @param {yargs.Arguments} args - the command line arguments from the user
     * @param {IProfile} profile - the profile object so far.
     */
    private insertDependenciesIntoProfileFromCLIArguments(args: Arguments, profile: IProfile): void {
        if (this.profileTypeConfiguration.dependencies != null) {
            const dependencies: Array<{ type: string, name: string }> = [];
            for (const dependency of this.profileTypeConfiguration.dependencies) {
                const optionName = ProfileUtils.getProfileOption(dependency.type);
                if (args[optionName] != null) {
                    const dependentProfileName = args[optionName];
                    this.log.debug("Inserting dependency profile named \"%s\" of type \"%s\"", dependentProfileName, dependency.type);
                    dependencies.push({
                        type: dependency.type,
                        name: dependentProfileName as string
                    });
                }
            }
            profile.dependencies = dependencies;
        }
    }

}
