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

import { ICommandOptionDefinition } from "../doc/option/ICommandOptionDefinition";
/**
 * Option constants - includes static options built/added by request (on imperative config or command definitions).
 * @export
 * @class OptionConstants
 */
export class OptionConstants {
    /**
     * The response format filter options allows users to filter (include) fields/properties in an output table/object.
     * Enable this option by specifying "outputFormatOptions: true" on your ICommandDefinition document.
     * @static
     * @type {ICommandOptionDefinition}
     * @memberof OptionConstants
     */
    public static readonly RESPONSE_FORMAT_FILTER_OPTION: ICommandOptionDefinition = {
        name: "response-format-filter",
        aliases: ["rff"],
        description: "Filter (include) fields in the response. " +
            "Accepts an array of field/property names to include in the output response. " +
            "You can filter JSON objects properties OR table columns/fields. " +
            "In addition, you can use this option in conjunction with '--response-format-type' " +
            "to reduce the output of a command to a single field/property or a list of a single field/property.",
        type: "array",
        group: "Response Format Options"
    };

    /**
     * The response format header option allows users to include a table header (or not).
     * Enable this option by specifying "outputFormatOptions: true" on your ICommandDefinition document.
     * @static
     * @type {ICommandOptionDefinition}
     * @memberof OptionConstants
     */
    public static readonly RESPONSE_FORMAT_HEADER_OPTION: ICommandOptionDefinition = {
        name: "response-format-header",
        aliases: ["rfh"],
        description: "If \"--response-format-type table\" is specified, include the column headers in the output.",
        type: "boolean",
        group: "Response Format Options",
        defaultValue: null
    };

    /**
     * The array of available format types (for the response-format-type definition allowable values).
     * @static
     * @type {string[]}
     * @memberof OptionConstants
     */
    public static readonly RESPONSE_FORMAT_TYPES: string[] = ["table", "list", "object", "string"];

    /**
     * The response format type option allows users control over handler output (print/console) data format.
     * Enable this option by specifying "outputFormatOptions: true" on your ICommandDefinition document.
     * @static
     * @type {ICommandOptionDefinition}
     * @memberof OptionConstants
     */
    public static readonly RESPONSE_FORMAT_OPTION: ICommandOptionDefinition = {
        name: "response-format-type",
        aliases: ["rft"],
        description: `The command response output format type. Must be one of the following:` +
            "\n\ntable: " +
            "Formats output data as a table. Use this option when the output data is an array of homogeneous JSON objects. " +
            "Each property of the object will become a column in the table." +
            "\n\nlist: Formats output data as a list of strings. Can be used on any data type (JSON objects/arrays) " +
            "are stringified and a new line is added after each entry in an array." +
            "\n\nobject: Formats output data as a list of prettified objects (or single object). " +
            "Can be used in place of \"table\" to change from tabular output to a list of prettified objects." +
            "\n\nstring: Formats output data as a string. JSON objects/arrays are stringified.",
        type: "string",
        allowableValues: {
            values: OptionConstants.RESPONSE_FORMAT_TYPES,
            caseSensitive: false
        },
        group: "Response Format Options"
    };

}
