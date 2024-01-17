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

import { format, inspect } from "util";
import { Arguments } from "yargs";
import { Logger } from "../../logger";
import { Constants } from "../../constants";
import { AbstractCommandYargs } from "./AbstractCommandYargs";
import { ICommandDefinition } from "../doc/ICommandDefinition";
import { ICommandResponseParms } from "../doc/response/parms/ICommandResponseParms";
import { CommandProcessor } from "../CommandProcessor";
import { CommandUtils } from "../utils/CommandUtils";
import { IProfileManagerFactory } from "../../profiles";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import { IHelpGeneratorFactory } from "../help/doc/IHelpGeneratorFactory";
import { ImperativeConfig } from "../../utilities/ImperativeConfig";
import { closest } from "fastest-levenshtein";
import { COMMAND_RESPONSE_FORMAT } from "../doc/response/api/processor/ICommandResponseApi";

/**
 * Before invoking commands, this class configures some settings and callbacks in Yargs,
 * including what happens on syntax failures.
 */
export class YargsConfigurer {
    constructor(private rootCommand: ICommandDefinition,
        private yargs: any,
        private commandRespParms: ICommandResponseParms,
        private profileManagerFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>,
        private helpGeneratorFactory: IHelpGeneratorFactory,
        private experimentalCommandDescription: string,
        private rootCommandName: string,
        private commandLine: string,
        private envVariablePrefix: string,
        private promptPhrase: string
    ) {
    }

    public configure() {

        /**
         * Add the command definitions to yargs
         */
        const logger = Logger.getImperativeLogger();

        this.yargs.help(false);
        this.yargs.version(false);
        this.yargs.showHelpOnFail(false);
        // finally, catch any undefined commands
        this.yargs.command({
            command: "*",
            description: "Unknown group",
            handler: (argv: any) => {
                const attemptedCommand = argv._.join(" ");
                if (attemptedCommand.trim().length === 0) {
                    if (argv.V) {
                        argv.version = true;
                    }

                    // Allocate a help generator from the factory
                    const rootHelpGenerator = this.helpGeneratorFactory.getHelpGenerator({
                        commandDefinition: this.rootCommand,
                        fullCommandTree: this.rootCommand,
                        experimentalCommandsDescription: this.experimentalCommandDescription
                    });

                    new CommandProcessor({
                        definition: this.rootCommand, fullDefinition: this.rootCommand,
                        helpGenerator: rootHelpGenerator,
                        profileManagerFactory: this.profileManagerFactory,
                        rootCommandName: this.rootCommandName,
                        commandLine: this.commandLine,
                        envVariablePrefix: this.envVariablePrefix,
                        promptPhrase: this.promptPhrase
                    }).invoke({ arguments: argv, silent: false, responseFormat: this.getResponseFormat(argv) })
                        .then((response) => {
                            Logger.getImperativeLogger().debug("Root help complete.");
                        })
                        .catch((rejected) => {
                            process.stderr.write("Internal Imperative Error: Root command help error occurred: "
                                + rejected.message + "\n");
                            Logger.getImperativeLogger().error(`Root unexpected help error: ${inspect(rejected)}`);
                        });
                } else {
                    // unknown command, not successful
                    process.exitCode = Constants.ERROR_EXIT_CODE;
                    const closestCommand = this.getClosestCommand(attemptedCommand);

                    argv.failureMessage = this.buildFailureMessage(closestCommand);
                    const failedCommandDefinition = this.buildFailedCommandDefinition();

                    // Allocate a help generator from the factory
                    const rootHelpGenerator = this.helpGeneratorFactory.getHelpGenerator({
                        commandDefinition: failedCommandDefinition,
                        fullCommandTree: failedCommandDefinition,
                        experimentalCommandsDescription: this.experimentalCommandDescription
                    });

                    // Create the command processor for the fail command
                    const failCommand = new CommandProcessor({
                        definition: failedCommandDefinition,
                        fullDefinition: failedCommandDefinition,
                        helpGenerator: rootHelpGenerator,
                        profileManagerFactory: this.profileManagerFactory,
                        rootCommandName: this.rootCommandName,
                        commandLine: ImperativeConfig.instance.commandLine,
                        envVariablePrefix: this.envVariablePrefix,
                        promptPhrase: this.promptPhrase
                    });

                    // Invoke the fail command
                    failCommand.invoke({ arguments: argv, silent: false, responseFormat: this.getResponseFormat(argv) })
                        .then((failedCommandResponse) => {
                            logger.debug("Finished invoking the 'FailedCommand' handler");
                        }).catch((err) => {
                            logger.error("%s", err.msg);
                        });
                }
            }
        });

        this.yargs.fail((msg: string, error: Error, failedYargs: any) => {
            process.exitCode = Constants.ERROR_EXIT_CODE;
            AbstractCommandYargs.STOP_YARGS = true; // todo: figure out a better way
            error = error || new Error(msg);
            const failedCommandDefinition = this.buildFailedCommandDefinition();

            // Allocate a help generator from the factory
            const failHelpGenerator = this.helpGeneratorFactory.getHelpGenerator({
                commandDefinition: failedCommandDefinition,
                fullCommandTree: failedCommandDefinition,
                experimentalCommandsDescription: this.experimentalCommandDescription
            });

            // Create the command processor for the fail command
            const failCommand = new CommandProcessor({
                definition: failedCommandDefinition,
                fullDefinition: failedCommandDefinition,
                helpGenerator: failHelpGenerator,
                profileManagerFactory: this.profileManagerFactory,
                rootCommandName: this.rootCommandName,
                commandLine: this.commandLine,
                envVariablePrefix: this.envVariablePrefix,
                promptPhrase: this.promptPhrase,
                daemonContext: ImperativeConfig.instance.daemonContext
            });

            const failureMessage = this.buildFailureMessage();

            // Construct the fail command arguments
            const argv: Arguments = {
                failureMessage,
                error,
                _: [],
                $0: Constants.PRIMARY_COMMAND
            };

            // Invoke the fail command
            failCommand.invoke({ arguments: argv, silent: false, responseFormat: this.getResponseFormat(argv) })
                .then((failedCommandResponse) => {
                    logger.debug("Finished invoking the 'FailedCommand' handler");
                }).catch((err) => {
                    logger.error("%s", err.msg);
                });
        });
        process.on("uncaughtException", (error: Error) => {
            process.exitCode = Constants.ERROR_EXIT_CODE;
            const failedCommandDefinition = this.buildFailedCommandDefinition();

            // Allocate a help generator from the factory
            const failHelpGenerator = this.helpGeneratorFactory.getHelpGenerator({
                commandDefinition: failedCommandDefinition,
                fullCommandTree: failedCommandDefinition,
                experimentalCommandsDescription: this.experimentalCommandDescription
            });

            // Create the command processor for failure
            let failureMessage = "Imperative encountered an unexpected exception";
            const failCommand = new CommandProcessor({
                definition: failedCommandDefinition,
                fullDefinition: failedCommandDefinition,
                helpGenerator: failHelpGenerator,
                profileManagerFactory: this.profileManagerFactory,
                rootCommandName: this.rootCommandName,
                commandLine: ImperativeConfig.instance.commandLine,
                envVariablePrefix: this.envVariablePrefix,
                promptPhrase: this.promptPhrase
            });

            failureMessage += `\nCommand entered: "${this.rootCommandName} ${ImperativeConfig.instance.commandLine}"`;
            const groupValues = ImperativeConfig.instance.commandLine.split(" ", 2);
            failureMessage += `\nUse "${this.rootCommandName} ${groupValues[0]} ${groupValues[1]} --help" to view groups, commands, and options.`;

            // Construct the arguments
            const argv: Arguments = {
                failureMessage,
                error,
                _: [],
                $0: Constants.PRIMARY_COMMAND
            };

            // Invoke the fail command processor
            failCommand.invoke({ arguments: argv, silent: false, responseFormat: this.getResponseFormat(argv) })
                .then((failedCommandResponse) => {
                    logger.debug("Finished invoking the 'FailedCommand' handler");
                }).catch((err) => {
                    logger.error("%s", err.msg);
                });
        });
    }

    /**
     * Builds the failure message that is passed to the failedCommand handler
     * @return {string} - Returns the failure message
     */
    private buildFailureMessage(closestCommand?: string) {

        const three: number = 3;
        let commands: string = "";
        let groups: string = " "; // default to " " for proper spacing in message
        let delimiter: string = ""; // used to delimit between possible 'command' values
        const groupValues = ImperativeConfig.instance.commandLine.split(" ", three);
        const commandToCheck = groupValues.join(" ");
        const nearestCommand: string = closestCommand || this.getClosestCommand(commandToCheck);

        let failureMessage = "Command failed due to improper syntax";
        if (closestCommand != null) {
            failureMessage += format("\nUnknown group: %s", groupValues[0]);
        }

        if (closestCommand != null || !commandToCheck.includes(nearestCommand)) {
            failureMessage += format("\nDid you mean: %s?\n", nearestCommand);
        }
        failureMessage += `\nCommand entered: "${ImperativeConfig.instance.commandLine}"`;
        // limit to three to include two levels of group and command value, if present

        // loop through the top level groups
        for (const group of this.rootCommand.children) {
            if ((group.name.trim() === groupValues[0]) || (group.aliases[0] === groupValues[0])) {
                groups += groupValues[0] + " ";
                // found the top level group so loop to see if second level group valid
                for (const group2 of group.children) {
                    if ((group2.name.trim() === groupValues[1]) || (group2.aliases[0] === groupValues[1])) {
                        groups += groupValues[1] + " ";
                        // second level group valid so command provided is invalid, retrieve the valid command(s)
                        for (let i = 0; i < group2.children.length; i++) {
                            if (i > 0) {
                                delimiter = ", ";
                            }
                            commands += delimiter + group2.children[i].name;
                        }
                        break;
                    }
                }
                break;
            }
        }

        if (commands.length > 0) {
            failureMessage += `\nAvailable commands are "${commands}".`;
        }
        failureMessage += `\nUse "${this.rootCommandName}${groups}--help" to view groups, commands, and options.`;
        return failureMessage;
    }

    /**
     * Define failed command with the current command line arguments.
     * @returns Failed command definition object
     */
    private buildFailedCommandDefinition(): ICommandDefinition {
        return {
            name: this.rootCommandName + " " + ImperativeConfig.instance.commandLine,
            handler: __dirname + "/../handlers/FailedCommandHandler",
            type: "command",
            description: "The command you tried to invoke failed"
        };
    }

    // /**
    //  * Constructs the response object for invoking help and error command handlers.
    //  * @param {boolean} silent - Enable silent mode
    //  * @param {boolean} printJsonResponse - Print a JSON response if requested.
    //  * @return {CommandResponse} - Returns the constructed command response object
    //  */
    // private buildResponseObject(silent = false, printJsonResponse = false): CommandResponse {
    //     return new CommandResponse({
    //         log: this.commandRespParms.log,
    //         silent: silent,
    //         printJsonOnResponse: printJsonResponse,
    //         primaryTextColor: this.commandRespParms.primaryTextColor,
    //         progressBarSpinner: this.commandRespParms.progressBarSpinner,
    //         progressBarPollFrequency: this.commandRespParms.progressBarPollFrequency
    //     });
    // }

    private getClosestCommand(attemptedCommand: string) {
        const commandTree = CommandUtils.flattenCommandTree(this.rootCommand, true);
        const commands: string[] = [];

        for (const commandEntry of commandTree) {
            if (commandEntry.fullName.trim().length === 0) {
                continue;
            }
            commands.push(commandEntry.fullName);
        }
        return closest(attemptedCommand, commands);
    }

    /**
     * Get the command response format based on whether `--rfj` is set.
     * @param argv Yargs arguments object
     */
    private getResponseFormat(argv: Arguments): COMMAND_RESPONSE_FORMAT {
        return argv[Constants.JSON_OPTION] ? "json" : "default";
    }
}
