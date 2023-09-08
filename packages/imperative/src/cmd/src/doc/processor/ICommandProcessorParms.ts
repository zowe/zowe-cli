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

import { ICommandDefinition } from "../ICommandDefinition";
import { IHelpGenerator } from "../../help/doc/IHelpGenerator";
import { IProfileManagerFactory } from "../../../../profiles";
import { ICommandProfileTypeConfiguration } from "../../../src/doc/profiles/definition/ICommandProfileTypeConfiguration";
/**
 * Parameters to create an instance of the Command Processor. Contains the command definition (for the command
 * being executed) and help, profiles, etc.
 * @export
 * @interface ICommandProcessorParms
 */
export interface ICommandProcessorParms {
    /**
     * The command definition node for the command being executed. The command definition is assumed to have a handler
     * (or handlers).
     * @type {ICommandDefinition}
     * @memberof ICommandProcessorParms
     */
    definition: ICommandDefinition;
    /**
     * The help generator for the command being executed.
     * @type {IHelpGenerator}
     * @memberof ICommandProcessorParms
     */
    helpGenerator: IHelpGenerator;
    /**
     * The profile manager factory allows the command processor to obtain an instance of the profile manager for
     * the command being issued.
     * @type {IProfileManagerFactory<ICommandProfileTypeConfiguration>}
     * @memberof ICommandProcessorParms
     */
    profileManagerFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>;
    /**
     * The root command name for the CLI - used in help generation, etc.
     * @type {string}
     * @memberof ICommandProcessorParms
     */
    rootCommandName: string;
    /**
     * The command line.
     * @type {string}
     * @memberof ICommandProcessorParms
     */
    commandLine: string;
    /**
     * Environmental variable name prefix used to construct configuration environmental variables.
     * @type {string}
     * @memberof ICommandProcessorParms
     */
    envVariablePrefix: string;
    /**
     * All ancestors (parents) of the command definition for the command being executed. Used in help generation.
     * @type {ICommandDefinition}
     * @memberof ICommandProcessorParms
     */
    fullDefinition?: ICommandDefinition;
    /**
     * The phrase used to indicate the user wants to enter the value of an argument in a hidden text prompt
     * @type {string}
     * @memberof ICommandProcessorParms
     */
    promptPhrase: string;
}
