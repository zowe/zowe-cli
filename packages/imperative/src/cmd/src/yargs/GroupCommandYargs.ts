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

import { Arguments, Argv } from "yargs";
import { AbstractCommandYargs, YargsCommandCompleted } from "./AbstractCommandYargs";
import { CommandYargs } from "./CommandYargs";
import { Constants } from "../../../constants";

/**
 * Imperative define group command to Yargs - defines the group and it's children to Yargs.
 */
export class GroupCommandYargs extends AbstractCommandYargs {

    /**
     * Define the group and its children to Yargs.
     * @param {YargsCommandCompleted} commandExecuted: The callback when this command is executed.
     */
    public defineCommandToYargs(commandExecuted: YargsCommandCompleted) {
        /**
         * Define the command to Yargs
         */
        this.yargs.command(
            /**
             * Specify the group name.
             */
            [this.definition.name].concat(this.definition.aliases),
            /**
             * Specify the group description.
             */
            this.definition.description,
            /**
             * The Yargs builder will define the children or child for this command group.
             * @param {yargs.Argv} argsForBuilder: The yargs instance to define the options
             * @return {yargs.Argv}: The populated instance.
             */
            (argsForBuilder: Argv) => {

                /**
                 * Define each child to Yargs.
                 */
                for (const child of this.definition.children) {

                    /**
                     * If this "child" is a provider-group or a plain group, create a new "Group" for Yargs.
                     * Otherwise, define the "child" command.
                     */
                    switch (child.type) {
                        // case "provider":
                        case "group":
                            new GroupCommandYargs({
                                yargsInstance: this.yargs,
                                commandDefinition: child,
                                yargsParent: this,
                                commandResponseParms: this.responseParms,
                                helpGeneratorFactory: this.helpGeneratorFactory,
                                experimentalCommandDescription: this.yargsParms.experimentalCommandDescription,
                                rootCommandName: this.rootCommandName,
                                commandLine: this.commandLine,
                                envVariablePrefix: this.envVariablePrefix,
                                promptPhrase: this.promptPhrase
                            }).defineCommandToYargs(commandExecuted);
                            break;
                        case "command":
                            new CommandYargs({
                                yargsInstance: this.yargs,
                                commandDefinition: child,
                                yargsParent: this,
                                commandResponseParms: this.responseParms,
                                helpGeneratorFactory: this.helpGeneratorFactory,
                                experimentalCommandDescription: this.yargsParms.experimentalCommandDescription,
                                rootCommandName: this.rootCommandName,
                                commandLine: this.commandLine,
                                envVariablePrefix: this.envVariablePrefix,
                                promptPhrase: this.promptPhrase
                            }).defineCommandToYargs(commandExecuted);
                            break;
                        default:
                            throw new Error(`Imperative Yargs Define Error: Command definition type ` +
                                `${child.type} invalid.`);
                    }
                }
                argsForBuilder.strict();
                CommandYargs.defineOptionsToYargs(argsForBuilder, this.definition.options);
                return argsForBuilder;
            },
            /**
             * Define the handler. Always invokes the help for a group.
             * @param {Arguments} argsForHandler
             */
            async (argsForHandler: Arguments) => {
                // TODO: figure out a better way to handle the fact that yargs keeps going after fail()
                if (!AbstractCommandYargs.STOP_YARGS) {
                    if (!argsForHandler[Constants.HELP_WEB_OPTION]) {
                        this.executeHelp(argsForHandler, commandExecuted);
                    } else {
                        this.executeWebHelp(argsForHandler, commandExecuted);
                    }
                }
            });

    }
}
