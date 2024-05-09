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

import { Arguments, Argv, Options } from "yargs";
import { isNullOrUndefined, inspect } from "util";
import { Constants } from "../../../constants";
import { IYargsResponse } from "./doc/IYargsResponse";
import { AbstractCommandYargs, YargsCommandCompleted } from "./AbstractCommandYargs";
import { ICommandOptionDefinition } from "../../src/doc/option/ICommandOptionDefinition";
import { ICommandDefinition } from "../doc/ICommandDefinition";
import { CommandProcessor } from "../CommandProcessor";
import { ICommandResponse } from "../../src/doc/response/response/ICommandResponse";
import { CommandResponse } from "../../src/response/CommandResponse";
import { ImperativeConfig } from "../../../utilities";

/**
 * Define an Imperative Command to Yargs. A command implies that an implementation is present (differs from a "group")
 * and it does not have children.
 */
export class CommandYargs extends AbstractCommandYargs {
    /**
     * Define the options to Yargs.
     * @param {yargs.Argv} yargsInstance: The instance of yargs to define the options.
     * @param {ICommandOptionDefinition[]} brightOptions: The option definition document array.
     */
    public static defineOptionsToYargs(yargsInstance: Argv, brightOptions: ICommandOptionDefinition[]): void {
        if (!isNullOrUndefined(brightOptions)) {
            for (const option of brightOptions) {
                const definition: Options = {
                    alias: option.aliases,
                    description: option.description
                };
                if (!isNullOrUndefined(option.type)) {
                    // don't let yargs handle any types that we are validating ourselves
                    // and don't use custom types as the yargs type since yargs won't understand
                    if (option.type !== "number" &&
                        option.type !== "json") {
                        definition.type = option.type as any;
                    } else if (option.type === "json") {
                        definition.type = "string";
                    }
                }
                // If this is a boolean type option, default it to undefined so that we can distinguish
                // between the user not specifying the option at all and them specifying =false
                if (option.type === "boolean") {
                    definition.default = undefined;
                }
                yargsInstance.option(option.name, definition);
            }
        }
    }

    /**
     * Define the Imperative JSON command definition to Yargs. Once the command is defined, Yargs will parse and
     * invoke its 'handler' (below). The handler can then invoke the potential "chain" of handlers in sequence and
     * is notified when they complete via a promise.
     * @param {YargsCommandCompleted} commandExecuted - Callback invoked when a command execution is complete.
     */
    public defineCommandToYargs(commandExecuted: YargsCommandCompleted) {
        // TODO: Fix this when we re-implement Experimental Features - always enabled for now
        // if (!this.definition.experimental || (ExperimentalFeatures.ENABLED)) {
        // console.log("experimental? " + this.definition.experimental)
        this.log.debug("Defining command: " + this.definition.name);
        /**
         * Define the command to Yargs.
         */
        this.yargs.command(
            /**
             * Define the command name, plus and positional arguments and aliases.
             */
            [this.definition.name + this.buildPositionalString()].concat(this.definition.aliases),
            /**
             * Define the description to yargs.
             */
            this.definition.description,
            /**
             * Define the options to Yargs.
             * @param {yargs.Argv} argsForBuilder: The yargs instance to define the options
             * @return {yargs.Argv}: The populated instance.
             */
            (argsForBuilder: Argv) => {
                this.log.debug("Defining command builder for: " + this.definition.name);
                argsForBuilder.strict();
                CommandYargs.defineOptionsToYargs(argsForBuilder, this.definition.options);
                return argsForBuilder;
            },
            /**
             * Define the handler for the command. Invoked when Yargs matches the input command to this definition.
             * If help is present, then we will invoke the help handler for the command definition.
             * @param {yargs.Argv} argsForHandler: The yargs instance with the specified command line options.
             */
            async (argsForHandler: Arguments) => {
                this.log.debug("Handler invoked for: " + this.definition.name);
                /**
                 * If help is present, invoke the help for this command definition.
                 */
                if (argsForHandler[Constants.HELP_OPTION] || argsForHandler[Constants.HELP_EXAMPLES]) {
                    this.log.debug("Executing help: " + this.definition.name);
                    this.executeHelp(argsForHandler, commandExecuted);
                } else if (argsForHandler[Constants.HELP_WEB_OPTION]) {
                    this.log.debug("Executing web help: " + this.definition.name);
                    this.executeWebHelp(argsForHandler, commandExecuted);
                } else {
                    this.log.debug("Executing Handlers: " + this.definition.name);

                    /**
                     * Before invoking the "command" we will build the complete set of handlers for the command.
                     * In some cases, "providers" may be present along the chain of definitions and must be invoked
                     * in sequence.
                     */
                    const handlerDefinition: any[] = [];
                    for (const parent of this.parents) {
                        const definition: any = parent.definition;
                        if (!isNullOrUndefined(definition.handler)) {
                            handlerDefinition.push(definition);
                        }
                    }
                    handlerDefinition.push(this.definition);

                    /**
                     * If handlers are present, invoke the set in sequence OR fail with an error - the "command"
                     */
                    if (handlerDefinition.length > 0) {
                        this.log.debug("Executing Handlers (%s total)", handlerDefinition.length);
                        const responses: ICommandResponse[] = [];

                        /**
                         * Invoke all handlers and collect all responses.
                         */
                        this.invokeHandlers(handlerDefinition, 0, argsForHandler, responses)
                            .then((successResponses) => {
                                commandExecuted(argsForHandler, this.getZoweYargsResponse(true,
                                    `${successResponses.length} command handlers invoked.`,
                                    "command handler invoked", successResponses));

                            })
                            .catch((errorResponses) => {
                                const response: IYargsResponse = this.getZoweYargsResponse(false,
                                    `Error in command ${this.definition.name}`,
                                    "command handler invoked", errorResponses);
                                this.log.error(`Error in command ${this.definition.name}`);
                                this.log.error(inspect(errorResponses, { depth: null }));
                                commandExecuted(argsForHandler, response);
                            });
                    } else {
                        /**
                         * No handlers were present - Respond with an error - this condition should not occur if the
                         * definition was validated against the schema.
                         */
                        const response: IYargsResponse = this.getZoweYargsResponse(false,
                            `No handlers provided for ${this.definition.name}`,
                            "command handler invoked");
                        commandExecuted(argsForHandler, response);
                    }
                }
            });
        // } else {
        //     this.log.debug("Experimental command %s disabled due to user settings", this.definition.name);
        // }
    }

    /**
     * Construct the positional argument string for Yargs. The positional arguments are always constructed as
     * "optional" to yargs. This prevents yargs from "throwing errors" if the user requests --help and the positional
     * parameters are not specified.
     * @return {string}: The positional argument string used in the Yargs command definition.
     */
    private buildPositionalString(): string {
        if (this.definition.positionals) {
            this.log.debug("Building positional string from: " + this.definition.name);
            let yargPositionalSyntax: string = (this.definition.positionals.length > 0) ? " " : "";
            this.definition.positionals.forEach((positional) => {
                yargPositionalSyntax += ("[" + positional.name + "] ");
            });
            const posString: string = yargPositionalSyntax.substr(0, yargPositionalSyntax.lastIndexOf(" "));
            this.log.debug("Positional String: " + posString);
            return posString;
        } else {
            return "";
        }
    }

    /**
     * Invoke the "chain" of command handlers provided for this definition.
     * @param {ICommandDefinition[]} handlers: The array of handlers to invoke.
     * @param {number} index: The current index in the handler array.
     * @param {yargs.Argv} argsForHandler: The arguments passed on the command line for the handler.
     * @param {ICommandResponse[]} responses: The collection of responses from each handler.
     * @return {Promise<ICommandResponse[]>}: The promise to be fulfilled when all handlers are complete.
     */
    private invokeHandlers(handlers: ICommandDefinition[], index: number, argsForHandler: Arguments,
        responses: ICommandResponse[]): Promise<ICommandResponse[]> {
        return new Promise<ICommandResponse[]>((invokeHandlersResponse, invokeHandlersError) => {
            /**
             * If the index is greater than the handler array, fulfill the promise.
             */
            if (index > handlers.length - 1) {
                invokeHandlersResponse(responses);
            } else {

                // TODO: figure out a better way to handle the fact that yargs keeps going after fail()
                if (!AbstractCommandYargs.STOP_YARGS) {

                    // Determine if we should print JSON
                    const printJson: boolean = (index === handlers.length - 1) &&
                        (argsForHandler[Constants.JSON_OPTION] as boolean);

                    // Protect against issues allocating the command processor
                    try {
                        new CommandProcessor({
                            definition: handlers[index],
                            fullDefinition: this.constructDefinitionTree(),
                            helpGenerator: this.helpGeneratorFactory.getHelpGenerator({
                                commandDefinition: handlers[index],
                                fullCommandTree: this.constructDefinitionTree(),
                                experimentalCommandsDescription: this.yargsParms.experimentalCommandDescription
                            }),
                            profileManagerFactory: this.profileManagerFactory,
                            rootCommandName: this.rootCommandName,
                            commandLine: ImperativeConfig.instance.commandLine,
                            envVariablePrefix: this.envVariablePrefix,
                            promptPhrase: this.promptPhrase,
                            config: ImperativeConfig.instance.config,
                            daemonContext: ImperativeConfig.instance.daemonContext
                        }).invoke({
                            arguments: argsForHandler,
                            silent: false,
                            responseFormat: (printJson) ? "json" : "default"
                        }).then((commandHandlerResponse) => {
                            /**
                             * Push the responses - If an error occurs, reject the promise with the error response.
                             */
                            responses.push(commandHandlerResponse);
                            if (!commandHandlerResponse.success) {
                                invokeHandlersError(responses);
                            } else {
                                /**
                                 * Re-invoke with the next index.
                                 */
                                return this.invokeHandlers(handlers, ++index, argsForHandler, responses)
                                    .then((recursiveResponses) => {
                                        invokeHandlersResponse(recursiveResponses);
                                    })
                                    .catch((recursiveError) => {
                                        invokeHandlersError(recursiveError);
                                    });
                            }
                        }).catch((error) => {
                            invokeHandlersError(error);
                        });
                    } catch (processorError) {
                        const response = new CommandResponse({
                            silent: false,
                            responseFormat: (printJson) ? "json" : "default",
                            stream: ImperativeConfig.instance.daemonContext?.stream
                        });
                        response.failed();
                        response.console.errorHeader("Internal Command Error");
                        response.console.error(processorError.message);
                        response.setError({
                            msg: processorError.message
                        });
                        if (response.responseFormat === "json") {
                            response.writeJsonResponse();
                        }
                        invokeHandlersError(processorError);
                    }
                }
            }
        });
    }
}
