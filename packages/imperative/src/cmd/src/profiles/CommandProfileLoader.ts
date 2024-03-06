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
import { IProfile, IProfileLoaded } from "../../../profiles";
import { CommandProfiles } from "./CommandProfiles";
import { inspect } from "util";
import { ICommandProfileLoaderParms } from "../doc/profiles/parms/ICommandProfileLoaderParms";
import { Logger } from "../../../logger";
import { ImperativeExpect } from "../../../expect";

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
     * @param {ICommandProfileLoaderParms} parms - contains command definition and logger
     * @returns
     * @memberof CommandProfileLoader
     */
    public static loader(parms: ICommandProfileLoaderParms) {
        return new CommandProfileLoader(parms.commandDefinition, parms.logger || Logger.getImperativeLogger());
    }

    /**
     * The input command definition for the command being issued.
     * @private
     * @type {ICommandDefinition}
     * @memberof CommandProfileLoader
     */
    private mCommandDefinition: ICommandDefinition;

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
     * @param {any} [logger=Logger.getImperativeLogger()] - A log4js instance
     * @memberof CommandProfileLoader
     */
    constructor(commandDefinition: ICommandDefinition, logger = Logger.getImperativeLogger()) {
        const err: string = "Could not construct the profile loader.";
        ImperativeExpect.toNotBeNullOrUndefined(commandDefinition, `${err} No command definition supplied.`);
        this.mCommandDefinition = commandDefinition;
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

        // We no longer read V1 profile files, so just return empty maps
        return new CommandProfiles(profileMap, profileMetaMap);
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
