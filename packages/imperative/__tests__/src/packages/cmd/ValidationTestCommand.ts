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

import { ICommandDefinition } from "../../../../packages/cmd/index";

export const ValidationTestCommand: ICommandDefinition = {
    name: "validation-test",
    aliases: ["valtest"],
    description: "Test for automatic syntax validation",
    type: "command",
    handler: __dirname + "/ValidationTestCommandHandler",
    options:
        [
            {
                name: "option-to-specify-1",
                description: "Part of must specify one group",
                type: "boolean"
            },
            {
                name: "option-to-specify-2",
                description: "Part of must specify one group",
                type: "boolean",
                implies: ["implied-by-2"]
            },
            {
                name: "option-to-specify-3",
                description: "Part of must specify one group",
                type: "string",
                allowableValues: {values: ["allowableA", "allowableB", "^allowableC\\$"], caseSensitive: false}
            },
            {
                name: "option-to-specify-4",
                description: "Part of must specify one group",
                type: "array",
                allowableValues: {values: ["allowableA", "allowableB"], caseSensitive: false}
            },
            {
                name: "conflicts-with-1",
                description: "Conflicts with option-to-specify-2",
                type: "string",
                conflictsWith: ["option-to-specify-1"]
            },
            {
                name: "implied-by-2",
                description: "Implied by option-to-specify-2",
                type: "boolean"
            },
            {
                name: "absence-implies",
                description: "Absence of this option implies presence of another",
                type: "boolean",
                absenceImplications: ["implied-by-absence"]
            },
            {
                name: "implied-by-absence",
                description: "implied by the absence of absence-implies",
                type: "boolean"
            },
            {
                name: "should-be-number",
                description: "should be a numerical value",
                type: "number",
            },
            {
                name: "dog-type",
                description: "A certain value of this option will imply 'fluffy'",
                type: "string",
                valueImplications: {
                    "Great Pyrenees": {
                        impliedOptionNames: ["fluffy"],
                        isCaseSensitive: false
                    }
                }
            },
            {
                name: "fluffy",
                description: "How fluffy the dog is",
                type: "string",
            },
            {
                name: "length-range",
                description: "this value should be less than or equal to eight characters long but " +
                "greater than or equal to 2 characters long",
                type: "string",
                stringLengthRange: [2, 8]
            },
            {
                name: "eggs-to-eat",
                description: "How many eggs to eat out of a dozen",
                type: "number",
                numericValueRange: [1, 12]
            },
            {
                name: "array-allow-duplicate",
                description: "this array allows explicitly duplicate",
                type: "array",
                arrayAllowDuplicate: true
            },
            {
                name: "array-not-allow-duplicate",
                description: "this array does not allow duplicate",
                type: "array",
                arrayAllowDuplicate: false
            },
            {
                name: "implies-one-of",
                description: "this option implies at least one of a group of options",
                type: "boolean",
                impliesOneOf: ["fluffy", "eggs-to-eat"]
            },
            {
                name: "conflicts-with-multiple",
                description: "conflicts with multiple other options",
                type: "boolean",
                conflictsWith: ["conflicted-1", "conflicted-2", "conflicted-3"]
            },
            {
                name: "conflicted-1",
                description: "conflicted",
                type: "boolean"
            },
            {
                name: "conflicted-2",
                description: "conflicted",
                type: "boolean"
            },
            {
                name: "conflicted-3",
                description: "conflicted",
                type: "boolean"
            },
            {
                name: "always-required-boolean",
                description: "this flag is always required",
                type: "boolean",
                required: true
            },
            {
                name: "always-required-string",
                description: "this string is always required",
                type: "string",
                required: true
            },
        ],
    mustSpecifyOne: ["option-to-specify-1", "option-to-specify-2", "option-to-specify-3", "option-to-specify-4"]
};
