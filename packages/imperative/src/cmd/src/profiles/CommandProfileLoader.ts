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

import { Arguments } from "yargs";
import { ICommandDefinition } from "../doc/ICommandDefinition";
import { IProfile, IProfileLoaded, IProfileManagerFactory, ProfileUtils } from "../../../profiles";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import { CommandProfiles } from "./CommandProfiles";
import { inspect, isNullOrUndefined } from "util";
import { ICommandLoadProfile } from "../doc/profiles/parms/ICommandLoadProfile";
import { ICommandProfileLoaderParms } from "../doc/profiles/parms/ICommandProfileLoaderParms";
import { Logger } from "../../../logger";
import { ImperativeExpect } from "../../../expect";
import { ImperativeError } from "../../../error";
import { ImperativeConfig } from "../../../utilities";

/**
 * The command processor profile loader loads all profiles that are required (or optional) given a command
 * definitions requirements. It returns the CommandProfiles object (which contains the map and getters for the
 * command handlers usage).
 * @internal
 * @class CommandProfileLoader
 */
export class CommandProfileLoader {
    /**
     * Create a new instance of the profile loader
     * @static
     * @param {CommandResponse} response - The command response object, used to formulate messages, logs and errors
     * @param {ICommandDefinition} commandDefinition - The command definition for the command being issued (used to determine
     * what profiles to load for this command)
     * @param {IProfileManagerFactory<ICommandProfileTypeConfiguration>} factory - The profile manager factory (used to
     * obtain instances of profile managers for profiles that are to be loaded)
     * @returns
     * @memberof CommandProfileLoader
     */
    public static loader(parms: ICommandProfileLoaderParms) {
        return new CommandProfileLoader(parms.commandDefinition, parms.profileManagerFactory,
            parms.logger || Logger.getImperativeLogger());
    }

    /**
     * The input command definition for the command being issued.
     * @private
     * @type {ICommandDefinition}
     * @memberof CommandProfileLoader
     */
    private mCommandDefinition: ICommandDefinition;

    /**
     * The factory for getting profile manager instances.
     * @private
     * @type {IProfileManagerFactory<ICommandProfileTypeConfiguration>}
     * @memberof CommandProfileLoader
     */
    private mFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>;

    /**
     * Logger - supplied on the constructor - but defaults to the Imperative logger.
     * @private
     * @type {Logger}
     * @memberof CommandProfileLoader
     */
    private mLog: Logger;

    /**
     * Creates an instance of CommandProfileLoader.
     * @param {ICommandDefinition} commandDefinition - The input command definition for the command being issued.
     * @param {IProfileManagerFactory<ICommandProfileTypeConfiguration>} factory - The profile manager factory
     * @param {any} [logger=Logger.getImperativeLogger()] - A log4js instance
     * @memberof CommandProfileLoader
     */
    constructor(commandDefinition: ICommandDefinition, factory: IProfileManagerFactory<ICommandProfileTypeConfiguration>,
        logger = Logger.getImperativeLogger()) {
        const err: string = "Could not construct the profile loader.";
        ImperativeExpect.toNotBeNullOrUndefined(commandDefinition, `${err} No command definition supplied.`);
        ImperativeExpect.toNotBeNullOrUndefined(factory, `${err} No profile factory supplied.`);
        this.mCommandDefinition = commandDefinition;
        this.mFactory = factory;
        ImperativeExpect.toBeEqual((logger instanceof Logger), true, `${err} The "logger" supplied is not of type Logger.`);
        this.mLog = logger;
        this.log.trace(`Profile loader created for command: ${commandDefinition.name}`);
    }

    /**
     * Load the profiles for the command - the command arguments are supplied to grab the profile names from
     * the arguments supplied by the user.
     * @param {Arguments} commandArguments - The command arguments supplied on this command invocation (Yargs style)
     * @returns {Promise<CommandProfiles>} - The promise is fulfilled with the map object OR rejected with an
     * Imperative error
     * @memberof CommandProfileLoader
     */
    public async loadProfiles(commandArguments: Arguments): Promise<CommandProfiles> {
        // Validate parms
        ImperativeExpect.toNotBeNullOrUndefined(commandArguments, `Could not load profiles. No command arguments supplied.`);

        // Log the API call
        this.log.info(`Request to load profiles for command: ${this.definition.name}...`);
        this.log.trace(`Profile load arguments supplied:\n${inspect(commandArguments, {depth: null})}`);

        // Create the map that eventually will be returned
        const profileMap: Map<string, IProfile[]> = new Map<string, IProfile[]>();
        const profileMetaMap: Map<string, IProfileLoaded[]> = new Map<string, IProfileLoaded[]>();

        // do not load old school profiles if we are in team-config mode
        if (ImperativeConfig.instance.config?.exists) {
            return new CommandProfiles(profileMap, profileMetaMap);
        }

        // If there are no profile specifications on this command definition document node, then
        // we can immediately exit with an empty map
        if (!isNullOrUndefined(this.definition.profile)) {
            this.log.trace(`Loading profiles for command: ${this.definition.name}...`);
            const loadList: ICommandLoadProfile[] = this.constructLoadList(commandArguments);
            const responses: IProfileLoaded[] = await this.loadAll(loadList);
            this.log.debug(`"${responses.length}" profiles loaded.`);
            this.buildCommandMap(responses, profileMap);
            this.buildCommandMetaMap(responses, profileMetaMap);
            this.log.trace(`All profiles loaded for command: ${this.definition.name}...`);
        }

        // Return the command profiles object for the handler
        return new CommandProfiles(profileMap, profileMetaMap);

    }

    /**
     * Builds the command map for input the the command map object for the command handlers
     * @private
     * @param {IProfileLoaded[]} responses - The full list of profiles loaded for this command
     * @param {Map<string, IProfile[]>} map - The map to populate
     * @memberof CommandProfileLoader
     */
    private buildCommandMap(responses: IProfileLoaded[], map: Map<string, IProfile[]>) {
        for (const resp of responses) {
            if (resp.profile) {
                if (isNullOrUndefined(map.get(resp.type))) {
                    this.log.trace(`Adding first profile "${resp.name}" of type "${resp.type}" to the map.`);
                    map.set(resp.type, [resp.profile]);
                } else {
                    this.log.trace(`Adding profile "${resp.name}" of type "${resp.type}" to the map.`);
                    const existing = map.get(resp.type);
                    existing.push(resp.profile);
                }
            } else {
                this.log.debug(`Profile load response without a profile: ${resp.message}`);
            }
        }
    }

    /**
     * Builds the command meta map for input the the command map object for the command handlers
     * @private
     * @param {IProfileLoaded[]} responses - The full list of profiles loaded for this command
     * @param {Map<string, IProfile[]>} map - The meta map to populate
     * @memberof CommandProfileLoader
     */
    private buildCommandMetaMap(responses: IProfileLoaded[], map: Map<string, IProfileLoaded[]>) {
        for (const resp of responses) {
            if (resp.profile) {
                if (isNullOrUndefined(map.get(resp.type))) {
                    this.log.trace(`Adding first profile "${resp.name}" of type "${resp.type}" to the map.`);
                    map.set(resp.type, [resp]);
                } else {
                    this.log.trace(`Adding profile "${resp.name}" of type "${resp.type}" to the map.`);
                    const existing = map.get(resp.type);
                    existing.push(resp);
                }
            } else {
                this.log.debug(`Profile load response without a profile: ${resp.message}`);
            }
        }
    }

    /**
     * Builds the list of profiles to load for this command.
     * @private
     * @param {Arguments} commandArguments - The arguments supplied on the command (Yargs Style)
     * @returns {ICommandLoadProfile[]} - The list of profiles to load (and other control information)
     * @memberof CommandProfileLoader
     */
    private constructLoadList(commandArguments: Arguments): ICommandLoadProfile[] {
        let loadProfiles: ICommandLoadProfile[] = [];
        this.log.trace(`Building required profiles for the load list...`);
        loadProfiles = this.buildLoad(false, this.definition.profile.required, commandArguments);
        this.log.trace(`Building optional profiles to the load list...`);
        return loadProfiles.concat(this.buildLoad(true, this.definition.profile.optional, commandArguments));
    }

    /**
     * Builds the control parameters for the loading of each profile name/type.
     * @private
     * @param {boolean} optional - If the profile is optional
     * @param {string[]} types - The profile types to load
     * @param {Arguments} commandArguments - The command arguments
     * @returns {ICommandLoadProfile[]} - The list of profiles to load (and control parameters)
     * @memberof CommandProfileLoader
     */
    private buildLoad(optional: boolean, types: string[], commandArguments: Arguments): ICommandLoadProfile[] {
        const loadProfiles: ICommandLoadProfile[] = [];
        if (!isNullOrUndefined(types)) {
            // Construct the load control parameters for each required type
            types.forEach((type) => {

                // Assume some defaults
                const load: ICommandLoadProfile = {
                    name: undefined,
                    type,
                    userSpecified: false,
                    loadDefault: false,
                    optional
                };

                // If the argument is specified, indicate that this is a user specified load and if not
                // assume that the default should be loaded (but still required on the command)
                const profOpt = ProfileUtils.getProfileOptionAndAlias(type)[0];
                if (!isNullOrUndefined(commandArguments[profOpt])) {
                    load.userSpecified = true;
                    load.name = commandArguments[profOpt] as string;
                } else {
                    load.loadDefault = true;
                }

                // Add to the list
                this.log.trace(`Adding load parameters to list: ${inspect(load, {depth: null})}`);
                loadProfiles.push(load);
            });
        }

        // Return the list
        return loadProfiles;
    }

    /**
     * Invoke the profile managers to load the profiles requested for this command.
     * @private
     * @param {ICommandLoadProfile[]} list - The list of profiles to load and control parameters.
     * @returns {Promise<IProfileLoaded[]>} - The promise to fulfill with the entire load response OR rejected with
     * an Imperative Error.
     * @memberof CommandProfileLoader
     */
    private async loadAll(list: ICommandLoadProfile[]): Promise<IProfileLoaded[]> {

        // Attempt to load each profile indicated by the load control parameters
        const loadResponses: IProfileLoaded[] = [];
        for (const load of list) {
            this.log.debug(`Loading profile "${load.name}" of type "${load.type}".`);
            const response = await this.factory.getManager(load.type).load({
                loadDefault: load.loadDefault,
                name: load.name,
                failNotFound: !load.optional
            });

            // This is an exceptional case - the manager did not do it's job properly, but we will ensure
            // that if a profile was required (not optional), that it was loaded.
            if (!load.optional && (isNullOrUndefined(response) || isNullOrUndefined(response.profile))) {
                throw new ImperativeError({
                    msg: `Unexpected internal load error: The profile ` +
                    `"${(load.loadDefault) ? "default requested" : load.name}" was not loaded by the profile manager.`
                });
            }

            // Push the loaded resposne
            this.log.debug(`Adding dependencies "${response.name}" of type "${response.type}"`);
            loadResponses.push(response);

            // If dependencies have been loaded, we'll flatten the tree and push on the response list.
            if (response.dependenciesLoaded) {
                this.log.trace(`Dependencies have also been loaded, adding to list...`);
                const flatten = ProfileUtils.flattenDependencies(response.dependencyLoadResponses);
                for (const flat of flatten) {
                    this.log.debug(`Adding dependencies "${flat.name}" of type "${flat.type}"`);
                    loadResponses.push(flat);
                }
            }
        }

        // Return the full list of load responses
        return loadResponses;
    }

    /**
     * Accessor for the profile manager factory
     * @readonly
     * @private
     * @type {IProfileManagerFactory<ICommandProfileTypeConfiguration>}
     * @memberof CommandProfileLoader
     */
    private get factory(): IProfileManagerFactory<ICommandProfileTypeConfiguration> {
        return this.mFactory;
    }

    /**
     * Accessor for the command definition document
     * @readonly
     * @private
     * @type {ICommandDefinition}
     * @memberof CommandProfileLoader
     */
    private get definition(): ICommandDefinition {
        return this.mCommandDefinition;
    }

    /**
     * Accessor for the logging object
     * @readonly
     * @private
     * @type {Logger}
     * @memberof CommandProfileLoader
     */
    private get log(): Logger {
        return this.mLog;
    }
}
