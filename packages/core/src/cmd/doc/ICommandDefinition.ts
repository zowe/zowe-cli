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

import { ICommandExampleDefinition } from "./ICommandExampleDefinition";
import { IChainedHandlerEntry } from "./handler/IChainedHandlerEntry";
import { ICommandOptionDefinition } from "./option/ICommandOptionDefinition";
import { ICommandPositionalDefinition } from "./option/ICommandPositionalDefinition";
import { ICommandDefinitionPassOn } from "./ICommandDefinitionPassOn";
import { ICommandProfile } from "./profiles/definition/ICommandProfile";
/**
 * Command Segment type - either "group" or "command".
 *
 * "group" implies no handler and should have children. Use groups to logically arrange portions of your CLI.
 * "command" implies there is a handler and may or may not have children.
 */
export type ICommandNodeType = "group" | "command";

export const compareCommands = (a: ICommandDefinition, b: ICommandDefinition) => {
    return a.name.localeCompare(b.name);
};

/**
 * Interface describing the syntax and behavior definition of a command
 * or group of commands
 */
export interface ICommandDefinition {
    /**
     * The command or group name
     * @type {string}
     * @memberof ICommandDefinition
     */
    name: string;
    /**
     * The description - keep group descriptions "small" and include lengthier descriptions for "commands".
     * @type {string}
     * @memberof ICommandDefinition
     */
    description: string;
    /**
     * A shorter (~one line) description of your command
     * @type {string}
     * @memberof ICommandDefinition
     */
    summary?: string;
    /**
     * This documents segment type - either "group" or "command". See the type definition for more detail.
     * @type {ICommandNodeType}
     * @memberof ICommandDefinition
     */
    type: ICommandNodeType;
    /**
     * Pass on attributes of the current definition node to children
     * @type {ICommandDefinitionPassOn[]}
     * @memberof ICommandDefinition
     */
    passOn?: ICommandDefinitionPassOn[];
    /**
     * Aliases - any number of single or more character aliases can be specified.
     * @type {string[]}
     * @memberof ICommandDefinition
     */
    aliases?: string[];
    /**
     * If true, stdin will automatically be read before the handler of this command is invoked.
     * @type {string[]}
     * @memberof ICommandDefinition
     */
    enableStdin?: boolean;
    /**
     * The description for the stdin option - used if enableStdin is true
     * @type {string}
     * @memberof ICommandDefinition
     */
    stdinOptionDescription?: string;
    /**
     * If this property exists, the command is deprecated. The property value
     * is a string that identifies the replacement command. It is used in a
     * deprecation message similar to the following:
     *      This command is deprecated.
     *      Recommended replacement: value_of_deprecatedReplacement_goes_here
     *
     * @type {string}
     * @memberof ICommandDefinition
     */
    deprecatedReplacement?: string;
    /**
     * The set of examples displayed in the help for this command.
     * @type {ICommandExampleDefinition[]}
     * @memberof ICommandDefinition
     */
    examples?: ICommandExampleDefinition[];
    /**
     * The handler for this command - this is a string literal that is used on the "require" statement to load the
     * command handler - The handler itself must implement ICommandHandler. A string is used over an actual
     * instance because we do not want the handler (and its required dependencies) to be loaded before it is issued.
     *  @type {string}
     *  @memberof ICommandDefinition
     */
    handler?: string;
    /**
     * Build this command from multiple handlers chained together, remapping the response
     * to arguments for future handlers in the command.
     *
     * Limitations of chained handlers include:
     *   - The syntax of the command for each handler is not validated, since the full definition is not provided
     *   - You can only map arguments from the "data" field of the command response, so whatever you need
     *     to pass to a future handler in the chain must be passed to response.data.setObj
     * @type {IChainedHandlerEntry[]}
     * @memberof ICommandDefinition
     */
    chainedHandlers?: IChainedHandlerEntry[];
    /**
     * The Children for this command - used when the type is provider or group. Use the children to build complex
     * nested syntaxes - however bright modules must follow the prescribed command syntax structure for Brightside.
     * @type {ICommandDefinition[]}
     * @memberof ICommandDefinition
     */
    children?: ICommandDefinition[];
    /**
     * The options to be exposed on the command.
     * @type {ICommandOptionDefinition[]}
     * @memberof ICommandDefinition
     */
    options?: ICommandOptionDefinition[];
    /**
     * The positional arguments to be exposed on the command.
     * @type {ICommandPositionalDefinition[]}
     * @memberof ICommandDefinition
     */
    positionals?: ICommandPositionalDefinition[];
    /**
     * Must specify one indicates that you must specify one of the options listed.
     * @type {string[]}
     * @memberof ICommandDefinition
     */
    mustSpecifyOne?: string[];
    /**
     * Only one of the listed options can be specified
     * @type {string[]}
     * @memberof ICommandDefinition
     */
    onlyOneOf?: string[];
    /**
     * Auto-loading of profile specifications - see the interface definition for more details.
     * @type {ICommandProfile}
     * @memberof ICommandDefinition
     */
    profile?: ICommandProfile;
    /**
     * The command handlers are passed the definition document for the command. You can place any additional
     * "custom" definition information here.
     * @type {any}
     * @memberof ICommandDefinition
     */
    customize?: any;
    /**
     * Is this command experimental? If you set this to true, the command will
     * be marked with help text indicating that it is experimental. If this command
     * is of type "group" all descendant commands will be marked experimental
     * as well.
     * @type {boolean}
     * @memberof ICommandDefinition
     */
    experimental?: boolean;
    /**
     * Enable output format options (e.g. "--response-format-type"). The output format options are applied to data
     * that is presented to the handler response format APIs (see IHandlerResponseApi, "format" property). The intent
     * of of the output format options:
     *
     * 1) Simplify the code in a command handler. A "common" use-case for handler output is printing tables (or lists)
     *    of JSON objects/data OR a single JSON response object.
     *
     * 2) Passing the data described in (1) to the handler response format API and enabling the format options gives
     *    the user full control over the output format. They can choose to output an array of JSON objects as a table
     *    OR a list of prettified objects. The use can also choose to include table headers and filter fields. The user
     *    can also reduce the output of a table to a single column (or a JSON object to a single property) eliminating
     *    the need to manually code options such as "--only-print-this-one-field"
     *
     * See the "ICommandOutputFormat" JSDoc for details on the format types.
     *
     * The options enabled:
     *
     * --response-format-type [table|list|object|string]
     *
     *   Allows the user to control the output format of the data. See the "ICommandOutputFormat" interface for details.
     *
     * --response-format-filter [array of fields]
     *
     *   Allows the user to include only the fields specified in the filter array.
     *
     * --response-format-header [boolean]
     *
     *   Allows the user to optionally include the header with a table.
     *
     * @type {boolean}
     * @memberof ICommandDefinition
     */
    outputFormatOptions?: boolean;

    /**
     * Index signature
     */
    [key: string]: any;
}
