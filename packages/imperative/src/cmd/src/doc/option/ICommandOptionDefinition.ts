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

import { ICommandOptionAllowableValues } from "./ICommandOptionAllowableValues";
import { ICommandOptionValueImplications } from "./ICommandOptionValueImplications";

/**
 * The type of value that should be specified for an option by the user.
 * "array": an array of space delimited strings
 * "boolean": a switch - the user specifies:  true "--option-name" or false: "--option-name false"
 * "count" : accepting only whole numbers as input value
 * "existingLocalFile": a file for which fs.existsSync returns true
 * "json": a parseable JSON string
 * "number" : accepting integers as input value
 * "string" : string input that does not allow "" as a valid input value
 * "stringOrEmpty" : allow string to be empty when defined
 */
export type CommandOptionType =
    "array" |
    "boolean" |
    "count" |
    "existingLocalFile" |
    "json" |
    "number" |
    "string" |
    "stringOrEmpty";

/**
 * Used on a command definition to define option flags.
 */
export interface ICommandOptionDefinition {
    /**
     * The canonical/primary name for your option.
     * This is the first form of the option shown to the user and is
     * generally how you should refer to your option in documentation and programmatically.
     *
     * Note: yargs automatically places the values for --hyphenated-options in a camelCase format
     * after parsing the command line arguments, so you would be able to access params.arguments.hyphenatedOptions
     * from your handler as well as params.arguments["hyphenated-options"]'
     * @type {string}
     * @memberOf ICommandOptionDefinition
     */
    name: string;
    /**
     * Aliases for your option. These allow the user to specify
     * the option with a shorter or otherwise alternate name
     * e.g.  name: "puppy", aliases: ["p", "pup"] -
     *       the user can specify --puppy, -p, or --pup
     * @type {string[]}
     * @memberOf ICommandOptionDefinition
     */
    aliases?: string[];
    /**
     * The description of your option - displayed in the help text
     * for your command.
     * @type {string}
     * @memberOf ICommandOptionDefinition
     */
    description: string;
    /**
     * What type of value will the user specify for this option?
     * @type {CommandOptionType}
     * @memberOf ICommandOptionDefinition
     */
    type: CommandOptionType;
    /**
     * If the user doesn't specify this option, you can specify a default value here
     * that will be filled in automatically.
     * @type {any}
     * @memberOf ICommandOptionDefinition
     */
    defaultValue?: any;
    /**
     * The group/category for this option.
     * Options with the same group on the same command are grouped together
     * under a heading with this text.
     * @type {string}
     * @memberOf ICommandOptionDefinition
     */
    group?: string;

    /**
     * Is this option required? If it's required and the user
     * does not specify it, they will get a syntax error.
     *
     * Note: if you give a defaultValue to an option, it will always be
     * considered to have been specified.
     * @type boolean
     * @memberOf ICommandOptionDefinition
     */
    required?: boolean;

    /**
     * Defines which options this one conflicts with.
     *
     *
     * @type {string[]}
     * @example <caption>A and B can't be specified together</caption>
     * const def: ICommandOptionDefinition =
     * {
     *   name: "B",
     *   description
     *   conflictsWith: ["A"]
     * }
     * @memberOf ICommandOptionDefinition
     */
    conflictsWith?: string[];
    /**
     * If this option is specified, all options whose name appear in the "implies"
     * field must also be specified.
     * e.g. if this option is "vacation", and ["seat", "meal"] is the value for "implies",
     * then the user will get a syntax error if they specify --vacation but not --seat and --meal
     * @type {string[]}
     * @memberOf ICommandOptionDefinition
     */
    implies?: string[];

    /**
     * If this option is specified, at least one of the options whose name appear in the "impliesOneOf"
     * field must also be specified.
     * e.g. if this option is "vacation", and ["seat", "meal"] is the value for "impliesOneOf",
     * then the user will get a syntax error if they specify --vacation but not either --seat or --meal
     * @type {string[]}
     * @memberOf ICommandOptionDefinition
     */
    impliesOneOf?: string[];

    /**
     * Not specifying these options implies that you should specify
     * all options listed in "absenceImplications".
     *
     * e.g. if the user does not specify "vacation" then they must specify --job and --hours
     * @type {string[]}
     * @memberOf ICommandOptionDefinition
     */
    absenceImplications?: string[];

    /**
     * What values can be specified for this option?
     * See the type below for more details.
     * @type {ICommandOptionAllowableValues}
     * @memberOf ICommandOptionDefinition
     */
    allowableValues?: ICommandOptionAllowableValues;

    /**
     * Acceptable value range for number type options.
     * the first number is the minimum. the second is the maximum
     * So the value specified by the user must be  min <=  value <= max
     *
     * @type {[number, number]}
     * @memberOf ICommandOptionDefinition
     */
    numericValueRange?: [number, number];
    /**
     * Acceptable length range for string type options.
     * the first number is the minimum. the second is the maximum
     * So the length specified by the user must be  min <=  length <= max
     *
     * @type {[number, number]}
     * @memberOf ICommandOptionDefinition
     */
    stringLengthRange?: [number, number];
    /**
     * If the type is array, this option defines if duplicate values in array
     * are allowed. Default is true.
     *
     * @type {boolean}
     * @memberOf ICommandOptionDefinition
     */
    arrayAllowDuplicate?: boolean;
    /**
     * If the user specifies a certain value for this option,
     * then they must also specify other options (similar to a conditional "implies")
     *  @type {{[key: string]: ICommandOptionValueImplications}}
     * @memberOf ICommandOptionDefinition
     */
    valueImplications?: {
        [key: string]: ICommandOptionValueImplications;
    };
}
