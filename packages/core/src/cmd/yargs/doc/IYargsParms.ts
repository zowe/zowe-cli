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

import { Argv } from "yargs";

import { ICommandDefinition } from "../../doc/ICommandDefinition";
import { GroupCommandYargs } from "../GroupCommandYargs";
import { ICommandResponseParms } from "../../doc/response/parms/ICommandResponseParms";
import { IProfileManagerFactory } from "../../../profiles/doc/api/IProfileManagerFactory";
import { IHelpGeneratorFactory } from "../../help/doc/IHelpGeneratorFactory";

/**
 * Imperative Yargs parameters - used to define imperative commands to Yargs and provides guidance/parameters for
 * how response objects should be handled when yargs invokes the handlers.
 * @export
 * @interface IYargsParms
 */
export interface IYargsParms {
    /**
     * The instance of Yargs to define the commands.
     * @type {Argv}
     * @memberof IYargsParms
     */
    yargsInstance: Argv;
    /**
     * The command definition document.
     * @type {ICommandDefinition}
     * @memberof IYargsParms
     */
    commandDefinition: ICommandDefinition;
    /**
     * The command response parameters normally scraped from the Imperative configuration document.
     *
     * @type {ICommandResponseParms}
     * @memberof IYargsParms
     */
    commandResponseParms: ICommandResponseParms;
    /**
     * The help generator factory to be used in this CLI help generation
     * @type {AbstractHelpGeneratorFactory}
     * @memberof IYargsParms
     */
    helpGeneratorFactory: IHelpGeneratorFactory;
    /**
     * The profile manager factory to use in this CLI profile management.
     * @type {AbstractProfileManagerFactory<any>}
     * @memberof IYargsParms
     */
    profileManagerFactory: IProfileManagerFactory<any>;
    /**
     * Optionally override the experimental command help text block.
     * Used to propagate the user's configuration down to different yargs/cmd services.
     * @type {string}
     * @memberof IYargsParms
     */
    experimentalCommandDescription: string;
    /**
     * Root command name of the CLI.
     * @type {string}
     * @memberof IYargsParms
     */
    rootCommandName: string;
    /**
     * The command line.
     * @type {string}
     * @memberof IYargsParms
     */
    commandLine: string;
    /**
     * Environmental variable name prefix used to construct configuration environmental variables.
     * @type {string}
     * @memberof IYargsParms
     */
    envVariablePrefix: string;
    /**
     * The Yargs Parent object - only has meaning for nested/group commands.
     * @type {GroupCommandYargs}
     * @memberof IYargsParms
     */
    yargsParent?: GroupCommandYargs;
    /**
     * The phrase used to indicate the user wants to enter the value of an argument in a hidden text prompt
     * @type {string}
     * @memberof IYargsParms
     */
    promptPhrase: string;
}
