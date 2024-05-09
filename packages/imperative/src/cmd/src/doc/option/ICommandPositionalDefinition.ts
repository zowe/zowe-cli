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

import { CommandOptionType } from "./ICommandOptionDefinition";

/**
 * Positional option definition - used on a command definition to define positional operands.
 * Positional operands do not use --dashes. They are values specified after the full command string
 *  e.g.  group group group group command  mypositional --dash-option
 */
export interface ICommandPositionalDefinition {
    /**
     * The name of the positional operand.
     *
     * This name cannot contain a dash (-) or else the positional argument will not function properly.
     * This is a limitation of yargs.
     *
     * Appending "..." to the end of a name will allow for a space delimited
     * array of arguments. So if you specify `name = "abcd..."` and then
     * "a b c d" is specified for the positional argument, abcd = ["a", "b", "c", "d"]
     * @type {string}
     * @memberof ICommandPositionalDefinition
     */
    name: string;
    /**
     * The option type - used to validate that the user provided value is acceptable.
     * @type {CommandOptionType}
     * @memberof ICommandPositionalDefinition
     */
    type: CommandOptionType;
    /**
     * The description for the positional operand - used in the help and error messages.
     * @type {string}
     * @memberof ICommandPositionalDefinition
     */
    description: string;
    /**
     * True if this positional is required.
     * @type {boolean}
     * @memberof ICommandPositionalDefinition
     */
    required?: boolean;

    /**
     * A regex that will be used to match the input for this positional for validation.
     * @type {string}
     * @memberof ICommandPositionalDefinition
     */
    regex?: string;
    /**
     * What is an acceptable length range for your positional? e.g. between 1 and 8 characters: [1,8]
     * @type {[number, number]}
     * @memberof ICommandPositionalDefinition
     */
    stringLengthRange?: [number, number];
}
