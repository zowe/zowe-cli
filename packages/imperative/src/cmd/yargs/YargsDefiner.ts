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
import { inspect } from "util";
import { Logger } from "../../logger";
import { ICommandDefinition } from "../../cmd/doc/ICommandDefinition";
import { YargsCommandCompleted } from "./AbstractCommandYargs";
import { GroupCommandYargs } from "./GroupCommandYargs";
import { CommandYargs } from "./CommandYargs";
import { ICommandResponseParms } from "../../cmd/doc/response/parms/ICommandResponseParms";
import { IProfileManagerFactory } from "../../profiles";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import { IHelpGeneratorFactory } from "../help/doc/IHelpGeneratorFactory";

/**
 * Imperative Command Definer - Defines the Imperative command objects to Yargs for processing.
 */
export class YargsDefiner {
    /**
     * The Yargs instance object used to define the commands.
     */
    private mYargsInstance: Argv;
    private mPrimaryHighlightColor: string;
    private mRootCommandName: string;
    private mCommandLine: string;
    private mEnvVariablePrefix: string;
    private mHelpFactory: IHelpGeneratorFactory;
    private mProfileManagerFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>;
    private mExperimentalCommandDescription: string;
    private mPromptPhrase: string;

    /**
     * Logger instance
     */
    private log: Logger = Logger.getImperativeLogger();

    /**
     * Build the definer - maintains the Yargs instance for all future definitions.
     * @param {yargs.Argv} yargsInstance: The Yargs instance used to define the commands.
     * @param primaryHighlightColor -  main color to highlight help text headings and other text with
     * @param rootCommandName - the display name of the root command (e.g. "zowe" or "sample-cli")
     * @param envVariablePrefix - the environment variable prefix
     * @param profileManagerFactory - profile manager factory that can be used to instantiate new profile managers
     * @param helpGeneratorFactory - help generator factory that can be used to instantiate new help generators
     * @param experimentalCommandDescription - optionally overridden experimental command description to
     *                                         propagate to yargs services
     */
    constructor(yargsInstance: Argv,
        primaryHighlightColor: string,
        rootCommandName: string,
        commandLine: string,
        envVariablePrefix: string,
        profileManagerFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>,
        helpGeneratorFactory: IHelpGeneratorFactory,
        experimentalCommandDescription: string,
        promptPhrase: string) {
        this.mYargsInstance = yargsInstance;
        this.mPrimaryHighlightColor = primaryHighlightColor;
        this.mRootCommandName = rootCommandName;
        this.mCommandLine = commandLine;
        this.mEnvVariablePrefix = envVariablePrefix;
        this.mHelpFactory = helpGeneratorFactory;
        this.mProfileManagerFactory = profileManagerFactory;
        this.mExperimentalCommandDescription = experimentalCommandDescription;
        this.mPromptPhrase = promptPhrase;
    }

    /**
     * Accepts an Imperative command definition document and defines to Yargs.
     * @param {ICommandDefinition} definition: The Imperative JSON command definition document.
     * @param {YargsCommandCompleted} commandExecuted: An "event-style" callback that is invoked upon
     * completion of a command execution for this definition.
     * @param {ICommandResponseParms} responseParms - The response object parameters used when invoking commands and help
     */
    public define(definition: ICommandDefinition, commandExecuted: YargsCommandCompleted, responseParms: ICommandResponseParms) {
        /**
         * Build the appropriate Yargs abject, depending on specified type. An error is thrown if the type is
         * not recognized.
         */
        this.log.trace("Defining a new definition to Yargs:");
        this.log.trace(inspect(definition));
        switch (definition.type) {
            // case "provider":
            case "group":
                new GroupCommandYargs({
                    yargsInstance: this.mYargsInstance,
                    commandDefinition: definition,
                    commandResponseParms: responseParms,
                    helpGeneratorFactory: this.mHelpFactory,
                    profileManagerFactory: this.mProfileManagerFactory,
                    experimentalCommandDescription: this.mExperimentalCommandDescription,
                    rootCommandName: this.mRootCommandName,
                    commandLine: this.mCommandLine,
                    envVariablePrefix: this.mEnvVariablePrefix,
                    promptPhrase: this.mPromptPhrase
                }).defineCommandToYargs(commandExecuted);
                break;
            case "command":
                new CommandYargs({
                    yargsInstance: this.mYargsInstance,
                    commandDefinition: definition,
                    commandResponseParms: responseParms,
                    helpGeneratorFactory: this.mHelpFactory,
                    profileManagerFactory: this.mProfileManagerFactory,
                    experimentalCommandDescription: this.mExperimentalCommandDescription,
                    rootCommandName: this.mRootCommandName,
                    commandLine: this.mCommandLine,
                    envVariablePrefix: this.mEnvVariablePrefix,
                    promptPhrase: this.mPromptPhrase
                }).defineCommandToYargs(commandExecuted);
                break;
            default:
                throw new Error(`Imperative Yargs Definer Internal Error: Invalid command definition type: ` +
                    `${definition.type}`);
        }
    }
}
