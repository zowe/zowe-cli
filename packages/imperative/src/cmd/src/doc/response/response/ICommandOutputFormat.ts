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

/**
 * The available format types for formatting of output.
 *
 * list
 * ====
 * Formats the output data as a list of strings. If an array of objects is present in the output, each is stringified
 * and printed on a newline.
 *
 * table
 * =====
 * Formats the output data as a table using the properties as the column headers. You must ensure that the array of
 * objects is homogeneous for the table to print properly.
 *
 * string
 * ======
 * Formats the output data as a string. If the output data is an object/array it is stringified.
 *
 * object
 * ======
 * Formats the output a prettified JSON object.
 *
 * @type {OUTPUT_FORMAT}
 */
export type OUTPUT_FORMAT = "list" | "table" | "string" | "object" ;

/**
 * The output format object is returned from a successful command handler to dictate how the output for the
 * command should be formatted. This is an optional feature for Imperative and handlers are not required to
 * return this object (they can format their own output).
 *
 * These properties represent the defaults for the handler. If the command definition includes the output format
 * options, the options take precedence over the default values (see ICommandDefinition for details).
 * @export
 * @interface ICommandOutput
 */
export interface ICommandOutputFormat {
    /**
     * The output data to format. Common output data includes arrays of strings/objects, JSON objects, strings.
     * @type {*}
     * @memberof ICommandOutputFormat
     */
    output: any;
    /**
     * The output format type (see the type for details). In most cases, any data type returned (on the output property)
     * can be formatted according to the type specified here.
     * @type {OUTPUT_FORMAT}
     * @memberof ICommandOutput
     */
    format: OUTPUT_FORMAT;
    /**
     * If the response is an object (or an array of objects) these are the top level properties to keep. For example,
     * if an array of homogeneous objects are returned in the output, the fields that are NOT specified in this array
     * are removed/deleted from each object.
     * @type {string[]}
     * @memberof ICommandOutput
     */
    fields?: string[];
    /**
     * If response format table is specified, print the table headings
     * @type {boolean}
     * @memberof ICommandOutput
     */
    header?: boolean;
}
