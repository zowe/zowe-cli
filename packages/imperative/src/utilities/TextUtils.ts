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

import { format, isArray, isNullOrUndefined, isNumber, isString } from "util";

/**
 * Interface of an explanation map object
 */
export interface IExplanationMap {
    explainedParentKey: string;              // parent key name in case this is map for nested child JSON object
    ignoredKeys: string;                     // comma separated list of keys whose value will be ignored
    [key: string]: string | IExplanationMap; // all explained keys of JSON object at this level and 'link' to all nested JSON objects
    // which will be explained by their explanation maps
}

/**
 * Lightweight utilities for text manipulation/coloring.
 * Low import impact
 */
export class TextUtils {
    public static readonly DEFAULT_WRAP_WIDTH = 80;
    public static readonly AVAILABLE_CHALK_COLORS = ["red", "magenta", "blue", "green", "grey", "yellow", "cyan"];

    /**
     * Get the recommended width to wrap text. You can specify a preferred width,
     * but this method width return
     * @param {number} preferredWidth - the width you would like  to use if supported
     *                                  by the user's terminal
     * @returns {number} - the width that will work best for the user's terminal
     */
    public static getRecommendedWidth(preferredWidth: number = TextUtils.DEFAULT_WRAP_WIDTH): number {
        const widthSafeGuard = 8; // prevent partial words from continuing over lines
        const yargs = require("yargs");
        const maxWidth = !isNullOrUndefined(yargs.terminalWidth() && yargs.terminalWidth() > 0) ?
            (yargs.terminalWidth() - widthSafeGuard) : preferredWidth;
        return Math.min(preferredWidth, maxWidth);
    }

    public static renderWithMustache(template: string, values: any): string {
        const mustache = require("mustache");
        mustache.escape = (value: any) => {
            // don't do HTML escaping
            return value;
        };
        return mustache.render(template, values);
    }

    /**
     * Replace keys from an object with string explanations for those keys,
     * primarily so that they can be printed for the user to read.
     * @param original - the original object e.g. a response from a z/OSMF API {wrdKy4U: "weirdkeyvalue"}
     * @param explanationMap - an object that maps the original to the new format
     * @param includeUnexplainedKeys - should keys not covered by
     *        the explanation object be included in the result?
     * @returns {any} - the explained object
     */
    public static explainObject(original: any, explanationMap: IExplanationMap,
        includeUnexplainedKeys: boolean = true): any {

        // no object to explain, return null
        if (isNullOrUndefined(original)) {
            return null;
        }
        // no explanation map, return original
        if (isNullOrUndefined(explanationMap)) {
            return original;
        }

        // if original is array, then iterate through it recursively and return explained array
        if (Array.isArray(original)) {
            const explainedArray: any[] = [];
            for (const item of original) {
                explainedArray.push(TextUtils.explainObject(item, explanationMap, includeUnexplainedKeys));
            }
            if (explainedArray.length === 0) {
                return "none";
            }
            return explainedArray;
        }

        // future explained object
        const explainedObject: any = {};
        // array of keys to be ignored
        const ignoredKeys: string[] = explanationMap.ignoredKeys ? explanationMap.ignoredKeys.split(",") : [];

        // iterate through all keys in original object
        for (const key of Object.keys(original)) {
            let isKeyIncluded = true;
            // key in ignored list. Skip it
            if (ignoredKeys.indexOf(key) !== -1) {
                isKeyIncluded = false;
            }
            // key found, let's translate it
            if (explanationMap[key] && isKeyIncluded) {
                if (typeof explanationMap[key] === "string") {
                    // translate this key and assign the original value
                    explainedObject[explanationMap[key] as string] = original[key];
                } else {
                    // inner object found in the explanation map. We need to translate this one as well with recursive call
                    const childExplanationMap: IExplanationMap = explanationMap[key] as IExplanationMap;
                    const explainedKey = childExplanationMap.explainedParentKey ? childExplanationMap.explainedParentKey : key;
                    explainedObject[explainedKey] = TextUtils.explainObject(original[key], childExplanationMap, includeUnexplainedKeys);
                }
            }
            else if (includeUnexplainedKeys) {
                explainedObject[key] = original[key];
            }
        }
        return explainedObject;
    }

    /**
     *  Get a json object in tabular form
     * @param {any} object: Any JSON object
     * @param {any } options: Any JSON object to specify printing
     * @param  color  use  color on the result?
     */
    public static prettyJson(object: any, options?: any, color: boolean = true, append = "\n\n"): string {
        const prettyjson = require("prettyjson");

        /**
         *  Default options for printing prettyJson
         */
        const defaultOptions = (!color || process.env.FORCE_COLOR === "0") ? {
            noColor: true
        } : {
            keysColor: "yellow"
        };

        /**
         * If user specifies prettyJson options use those instead of default
         */
        return prettyjson.render(object, options || defaultOptions)
            .replace(/""" *\n((.|\n)*?)"""/g, "$1") + append;
    }

    /**
     *
     * @param {any[]} objects - the key-value objects to convert to a
     * @param primaryHighlightColor - the main color to highlight headings of the table with. e.g. "blue"
     * @param {number} maxColumnWidth - override the default column width of the table?
     * @param {boolean}  includeHeader - should the table include a header of the field names of the objects
     * @param includeBorders -  should the table have borders between the cells?
     * @param hardWrap - hard wrap the text within the width of the table cells (defaults to false)
     * @param headers - specify which headers in which order to display. if omitted, loops through the rows
     *        and adds object properties as headers in their enumeration order
     * @returns {string} the rendered table
     */
    public static getTable(objects: any[], primaryHighlightColor: string,
        maxColumnWidth?: number, includeHeader: boolean = true, includeBorders: boolean = false,
        hardWrap: boolean = false, headers?: string[]): string {
        const Table = require("cli-table3");

        // if the user did not specify which headers to use, build them from the object array
        if (!headers) {
            headers = this.buildHeaders(objects);
        }
        if (isNullOrUndefined(maxColumnWidth)) {
            maxColumnWidth = this.getRecommendedWidth() / headers.length;
        }
        const borderChars = includeBorders ?
            {
                "top": "═", "top-mid": "╤",
                "top-left": "╔", "top-right": "╗",
                "bottom": "═", "bottom-mid": "╧",
                "bottom-left": "╚",
                "bottom-right": "╝",
                "left": "║",
                "left-mid": "╟",
                "right": "║",
                "right-mid": "╢"
            } : {
                "top": "", "top-mid": "", "top-left": "", "top-right": "",
                "bottom": "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
                "left": "", "left-mid": "", "mid": "", "mid-mid": "",
                "right": "", "right-mid": "", "middle": " "
            };
        const table = new Table({
            // colWidths: headers.map((header) => {
            //     return header.length > maxColWidth ? maxColWidth + pad : header.length + pad;
            // }),
            // highlight the headers
            head: includeHeader ? headers.map((header) => {
                return TextUtils.wordWrap(TextUtils.chalk[primaryHighlightColor](header),
                    maxColumnWidth, "", hardWrap);
            }) : [],
            chars: borderChars,
            style: {"padding-left": 0, "padding-right": 0, "head": [], "border": includeBorders ? [] : undefined}
        });

        for (const obj of objects) {
            const row = headers.map((header) => {
                return TextUtils.wordWrap(obj[header] || "", maxColumnWidth, "", hardWrap);
            });
            table.push(row);
        }
        return table.toString();
    }

    /**
     *  Build table headers from an array of key-value objects
     * @param {any[]} objects - the key-value objects from which to build headers
     * @returns {string} the headers array
     */
    public static buildHeaders(objects: any[]): string[] {
        const headers = [];
        // for every property of every object in the array,
        // make a header for the table
        for (const obj of objects) {
            for (const key of Object.keys(obj)) {
                if (headers.indexOf(key) === -1) {
                    headers.push(key);
                }
            }
        }
        return headers;
    }

    /**
     * Wrap some text so that it fits within a certain width with the wrap-ansi package
     * @param {string} text The text you would like to wrap
     * @param {number} width - The width you would like to wrap to - we'll try to determine the
     *                  optimal width based on this (the resulting wrap may be wrapped to fewer columns, but not more)
     * @param {string} indent - Add this string to every line of the result
     * @param {boolean} hardWrap - do not allow any letters past the requested width - defaults to false
     * @returns {string}
     */
    public static wordWrap(text: string, width?: number,
        indent: string = "", hardWrap: boolean = false, trim: boolean = true): string {
        const wrappedText = require("wrap-ansi")(text, this.getRecommendedWidth(width), {hard: hardWrap, trim});
        return TextUtils.indentLines(wrappedText, indent);
    }

    /**
     * Indent some text
     * @param {string} text The text you would like to indent
     * @param {string} indent - Add this string to every line of the result
     * @returns {string}
     */
    public static indentLines(text: string, indent: string = ""): string {
        return text.split(/\n/g).map((line: string) => {
            if (line.length === 0) {
                return line;
            }
            return indent + line;
        }).join("\n");
    }

    /**
     * Highlight all matches of a full regex with TextUtils.chalk
     * @param {string} text - the text you'd like to search for matches
     * @param {RegExp} term - a regular expression of terms to highlight
     * @returns {string} - the highlighted string
     */
    public static highlightMatches(text: string, term: RegExp): string {
        return text.replace(term, (match: string) => {
            return TextUtils.chalk.blue(match);
        });
    }

    /**
     * Auto-detect whether a message should be formatted with printf-style formatting or mustache
     *  (but don't try to use both!) and format the string accordingly
     * @param {string} message - the string message  with %s or {{mustache}} style variables
     * @param values the fields that will resolve the printf or mustache template
     * @returns {string} - a formatted string with the variables inserted
     */
    public static formatMessage(message: string, ...values: any[]): string {
        if (!isNullOrUndefined(values)) {
            const isPrintfValue = (value: any) => {
                let isJson = false;
                try {
                    JSON.parse(value as string);
                    isJson = true;
                } catch (e) {
                    // not json
                }
                return isString(value) || isNumber(value) || isJson;
            };
            if (isArray(values) && values.filter(isPrintfValue).length === values.length) {
                message = format.apply(this, [message].concat(values));
            }
            else {
                message = TextUtils.renderWithMustache.apply(this, [message].concat(values));
            }
        }
        return message;
    }


    public static get chalk() {
        const mChalk = require("chalk");
        // chalk is supposed to handle this, but I think it only does so the first time it is loaded
        // so we need to check ourselves in case we've changed the environmental variables
        mChalk.enabled = process.env.FORCE_COLOR !== "0" && process.env.MARKDOWN_GEN == null;
        if (!mChalk.enabled) { mChalk.level = 0; }
        else if (process.env.FORCE_COLOR != null) {
            const parsedInt = parseInt(process.env.FORCE_COLOR);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (!isNaN(parsedInt) && parsedInt >= 0 && parsedInt <= 3) {
                mChalk.level = parsedInt;
            }
        }

        return mChalk;
    }

    /**
     * Parse a key value string into an object
     * @param {string} keysAndValues - a string in the format key1=value1,key2=value2,key3=value3.
     *                                 Note: the key names are case sensitive
     * @returns {{[key: string]: string}} the parsed object
     */
    public static parseKeyValueString(keysAndValues: string): { [key: string]: string } {
        const parsedObject: { [key: string]: string } = {};
        const keyValueExample = "key1=value1,key2=value2,key3=value3,key4WithCommaAndEquals=my\\=key\\,is good";
        // count unescaped commas and equals signs
        const numberOfEqualsSigns = (keysAndValues.match(/[^\\]=/g) || []).length;
        const numberOfCommas = (keysAndValues.match(/[^\\],/g) || []).length;

        if (!/[^\\]=/g.test(keysAndValues) ||
            (numberOfEqualsSigns > 1 && numberOfCommas !== (numberOfEqualsSigns - 1))
        ) {
            throw new Error("The keys and values provided are not in the expected format. Example of expected format: " + keyValueExample);
        }
        // make it easier to deal with the key value string by replacing unescaped equals signs and commas
        const keyValueEntrySplitKey = "_SPLIT_ENTRY_";
        const valueSplitKey = "_SPLIT_KEY_";
        keysAndValues = keysAndValues.replace(/([^\\]),/g, "$1" + keyValueEntrySplitKey);
        keysAndValues = keysAndValues.replace(/([^\\])=/g, "$1" + valueSplitKey);
        keysAndValues = keysAndValues.replace(/\\,/g, ","); // un-escape commas
        keysAndValues = keysAndValues.replace(/\\=/g, "="); // un-escape equals signs
        const args = keysAndValues.split(keyValueEntrySplitKey);
        for (const arg of args) {
            const [key, value] = arg.split(valueSplitKey);
            parsedObject[key] = value;
        }
        return parsedObject;
    }

    /**
     * Render a mustache template based on arguments from the user
     * @param {string} template - the mustache-style template string into which you would like to insert your values
     * @param {string} keysAndValues - a string in the format key1=value1,key2=value2,key3=value3.
     *                                 Note: the key names are case sensitive
     * @returns {string} - the rendered template
     * @throws an Error if the keysAndValues are not in the expected format
     */
    public static renderTemplateFromKeyValueArguments(template: string, keysAndValues: string): string {
        const mustacheValues: { [key: string]: string } = TextUtils.parseKeyValueString(keysAndValues);
        return TextUtils.formatMessage(template, mustacheValues);
    }

}
