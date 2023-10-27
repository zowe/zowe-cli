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

import { ImperativeError } from "../../error";
import { inspect, isNullOrUndefined } from "util";

const DataObjectParser = require("dataobject-parser");

/**
 * Helper class for paramter validation. Expectations that fail will throw an ImperativeError with a validation
 * error message.
 *
 * All methods allow keys to be specified as "property1.prop.lastprop" for example.
 *
 * @export
 * @class ImperativeExpect
 */
export class ImperativeExpect {
    /**
     * The error tag to append to each error message.
     * @static
     * @type {string}
     * @memberof ImperativeExpect
     */
    public static readonly ERROR_TAG: string = "Expect Error";

    /**
     * Expect a situation and transform the error (if expect fails).
     * Accepts two methods of your implementation to:
     * A) Test the expect (which is intended to throw an ImperativeError)
     * B) Transform and return a new ImperativeError
     * This allows you complete control over the contents of the error. If you are only interested in influencing the
     * message displayed, then use the msg parm on each of the expect functions.
     * @static
     * @param {() => void} expect - The method that contains your ImperativeExpect invocation
     * @param {(error: any) => ImperativeError} transform - Passed the error thrown by the expect and expects you
     * to return the ImperativeError you would like thrown.
     * @memberof ImperativeExpect
     */
    public static expectAndTransform(expect: () => void, transform: (error: any) => ImperativeError) {
        try {
            expect();
        } catch (error) {
            if (error instanceof ImperativeError) {
                throw transform(error);
            } else {
                throw new ImperativeError(
                    {
                        msg: "Expect and Transform is expecting that the expect method throws an ImperativeError."
                    },
                    {
                        tag: ImperativeExpect.ERROR_TAG
                    });
            }
        }
    }

    /**
     * Expect that values are equal (via "!==" operator).
     * @static
     * @param {*} value1 - Value 1
     * @param {*} value2 - Value 2
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static toBeEqual(value1: any, value2: any, msg?: string) {
        if (value1 !== value2) {
            throw new ImperativeError({msg: msg || "Input objects/values are NOT equal"},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect that value matches the regular expression (via ".test()" method).
     * @static
     * @param {*} value - Value
     * @param {*} myRegex - Regular expression
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static toMatchRegExp(value: any, myRegex: string, msg?: string) {
        if (!(new RegExp(myRegex).test(value))) {
            throw new ImperativeError({msg: msg || "Input object/value does not match the regular expression"},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect the object passed to be defined.
     * @static
     * @param {*} obj - The object to check
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static toNotBeNullOrUndefined(obj: any, msg?: string) {
        if (isNullOrUndefined(obj)) {
            throw new ImperativeError({msg: msg || "Required object must be defined"},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect the object passed to be an array that contains a particular entry.
     * Your compare method is invoked to determine if the entry you're looking for is found within the array.
     * @static
     * @param {any[]} arr - the array to search
     * @param {(parms: any) => boolean} compare - compare method (passed the parms) - return true if the entry is
     * found within the array.
     * @param {string} [msg] - The message to throw - overrides the default message
     * @returns {*} - If a match is found, it will return the match.
     * @memberof ImperativeExpect
     */
    public static arrayToContain(arr: any[], compare: (entry: any) => boolean, msg?: string): any {
        ImperativeExpect.toBeAnArray(arr, msg);
        let foundEntry: any;
        for (const entry of arr) {
            if (compare(entry)) {
                foundEntry = entry;
                break;
            }
        }
        if (isNullOrUndefined(foundEntry)) {
            throw new ImperativeError({
                msg: msg || "The required entry was NOT found within the input array: " +
                    arr.map((entry) => inspect(entry))
            },
            {tag: ImperativeExpect.ERROR_TAG});
        }

        return foundEntry;
    }

    /**
     * Check if the input is one of several possibilities in a list.
     * @static
     * @param {*} value - The value to find in following array
     * @param {any[]} arr - The array of possible items we could be expecting
     * @param {string} [msg] - The message - overrides the default message
     * @returns {*} - If a match is found, it will return the match.
     * @memberof ImperativeExpect
     */
    public static toBeOneOf(value: any, arr: any[], msg?: string): any {
        ImperativeExpect.toNotBeNullOrUndefined(value, msg);
        return ImperativeExpect.arrayToContain(arr, (entry) => {
            return entry === value;
        }, msg);
    }

    /**
     * Check if the input object is an array.
     * @static
     * @param {any[]} arr - The array to check
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static toBeAnArray(arr: any[], msg?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(arr, msg);
        if (!Array.isArray(arr)) {
            throw new ImperativeError({msg: msg || "Required parameter '" + arr + "' must be an array."},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect a set of keys (by name) to be defined, of type array, and optionally a non-zero length array.
     * @static
     * @param obj - the object for which you would like to assert that certain fields
     * @param nonZeroLength if true, the length of the array must be non zero
     * @param {...string[]} keys - keys in object that should be arrays
     * @param {string} [msg] - The message to throw - overrides the default message
     */
    public static keysToBeAnArray(obj: { [key: string]: any } | any, nonZeroLength: boolean, keys: string[],
        msg?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(obj, msg);
        const objParser = new DataObjectParser(obj);
        keys.forEach((key) => {
            if (isNullOrUndefined(objParser.get(key))) {
                throw new ImperativeError({msg: msg || "Required parameter '" + key + "' must be defined"},
                    {tag: ImperativeExpect.ERROR_TAG});
            }
            ImperativeExpect.toBeAnArray(objParser.get(key), msg);
            const arr: any[] = objParser.get(key);
            if (nonZeroLength) {
                if (arr.length === 0) {
                    throw new ImperativeError({msg: msg || "Required parameter '" + key + "' must be an array with at least 1 entry."},
                        {tag: ImperativeExpect.ERROR_TAG});
                }
            }
        });
    }

    /**
     * Expect a set of keys (by name) are defined.
     * @static
     * @param {{[key: string]: any}} obj - object to test existence
     * @param {...string[]} keys - keys in object
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static keysToBeDefined(obj: { [key: string]: any } | any, keys: string[], msg?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(obj, msg);
        const objParser = new DataObjectParser(obj);
        keys.forEach((key) => {
            if (isNullOrUndefined(objParser.get(key))) {
                throw new ImperativeError({msg: msg || "Required parameter '" + key + "' must be defined"},
                    {tag: ImperativeExpect.ERROR_TAG});
            }
        });
    }

    /**
     * Expect two values to be equal (via "===" operator).
     * @static
     * @param {*} value1 - Value 1
     * @param {*} value2 - Value 2
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static toNotBeEqual(value1: any, value2: any, msg?: string) {
        if (value1 === value2) {
            throw new ImperativeError({msg: msg || 'Values specified are equal ("' + value1 + '")'},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect that a set of keys are defined, of type string, and are non-blank (after trimming).
     * @static
     * @param {{[key: string]: string}} obj - object to test existence
     * @param {...string[]} keys - keys in object
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static keysToBeDefinedAndNonBlank(obj: { [key: string]: string } | any, keys: string[], msg?: string) {
        ImperativeExpect.keysToBeDefined(obj, keys, msg);
        ImperativeExpect.keysToBeOfType(obj, "string", keys, msg);
        const objParser = new DataObjectParser(obj);
        keys.forEach((key) => {
            if (objParser.get(key).trim().length === 0) {
                throw new ImperativeError({msg: msg || "Required parameter '" + key + "' must not be blank"},
                    {tag: ImperativeExpect.ERROR_TAG});
            }
        });
    }

    public static toBeDefinedAndNonBlank(item: string, label: string, msg?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(item, msg);
        if (item.toString().trim().length === 0) {
            throw new ImperativeError({msg: "Required parameter '" + label + "' must not be blank"},
                {tag: ImperativeExpect.ERROR_TAG});
        }
    }

    /**
     * Expect a set of keys to be of a certain type.
     * @static
     * @param {{ [key: string]: any }} obj - The input object
     * @param {string} type - The type to check for (only primatives - uses "typeof")
     * @param {...string[]} keys - A list of keys to check in the object
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static keysToBeOfType(obj: { [key: string]: any } | any, type: string, keys: string[], msg?: string) {
        ImperativeExpect.keysToBeDefined(obj, keys);
        const objParser = new DataObjectParser(obj);
        keys.forEach((key) => {
            if (typeof objParser.get(key) !== type) {
                throw new ImperativeError({msg: "Object key '" + key + "' must be of type '" + type + "'"},
                    {tag: ImperativeExpect.ERROR_TAG});
            }
        });
    }

    /**
     * Expect a set of keys to be undefined.
     * @static
     * @param {{[key: string]: any}} obj - object to test existence
     * @param {...string[]} keys - keys in object
     * @param {string} [msg] - The message to throw - overrides the default message
     * @memberof ImperativeExpect
     */
    public static keysToBeUndefined(obj: { [key: string]: any }, keys: string[], msg?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(obj, msg);
        keys.forEach((key) => {
            if (!isNullOrUndefined(obj[key])) {
                throw new ImperativeError({msg: "Required parameter '" + key + "' must be undefined"},
                    {tag: ImperativeExpect.ERROR_TAG});
            }
        });
    }
}
