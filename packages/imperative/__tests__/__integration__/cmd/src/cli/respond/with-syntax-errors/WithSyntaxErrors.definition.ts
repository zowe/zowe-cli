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

import { ICommandDefinition } from "../../../../../../../lib";

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, " +
    "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
    "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat " +
    "nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia " +
    "deserunt mollit anim id est laborum.";

const UPPER = 3;

export const WithSyntaxErrorsDefinition: ICommandDefinition = {
    name: "with-syntax-errors",
    description: "Responds with syntax errors",
    summary: "Responds with syntax errors",
    handler: __dirname + "/WithSyntaxErrorsResponses.handler",
    type: "command",
    mustSpecifyOne: ["must-specify-one-of-abc-maybe-a",
        "must-specify-one-of-abc-maybe-b",
        "must-specify-one-of-abc-maybe-c"],
    onlyOneOf: ["only-specify-one-of-abc-maybe-a",
        "only-specify-one-of-abc-maybe-b"],
    positionals: [
        {
            name: "positionalparams",
            description: "The positional param " + LOREM,
            type: "string",
            regex: "ABC",
            required: true
        }
    ],
    options: [
        {
            name: "long-option",
            aliases: ["lo"],
            description: LOREM,
            type: "string",
            required: true,
            implies: ["required-with-long-option"]
        },
        {
            name: "required-with-long-option",
            description: "This is required with --long-option",
            type: "boolean"
        },
        {
            name: "must-specify-one-of-abc-maybe-a",
            description: "a must specify one option - maybe a" + LOREM,
            type: "string"
        },
        {
            name: "must-specify-one-of-abc-maybe-b",
            description: "a must specify one option - maybe b" + LOREM,
            type: "string"
        },
        {
            name: "must-specify-one-of-abc-maybe-c",
            description: "a must specify one option - maybe c" + LOREM,
            type: "string"
        },
        {
            name: "only-specify-one-of-abc-maybe-a",
            description: "a only specify one option - maybe a" + LOREM,
            type: "string"
        },
        {
            name: "only-specify-one-of-abc-maybe-b",
            description: "a only specify one option - maybe b" + LOREM,
            type: "string"
        },
        {
            name: "json-option",
            description: "The JSON option" + LOREM,
            type: "json",
            required: true
        },
        {
            name: "absence-impl-a",
            description: "absence-impl-a" + LOREM,
            type: "string",
            absenceImplications: ["absence-impl-b",
                "absence-impl-c"]
        },
        {
            name: "absence-impl-b",
            description: "absence-impl-b" + LOREM,
            type: "string"
        },
        {
            name: "absence-impl-c",
            description: "absence-impl-c" + LOREM,
            type: "string"
        },
        {
            name: "value-range",
            description: "value-range" + LOREM,
            type: "number",
            numericValueRange: [1, UPPER],
            required: true
        },
        {
            name: "fake-file",
            description: "fake-file" + LOREM,
            type: "existingLocalFile",
            required: true
        },
        {
            name: "string-length-over-max",
            description: "fake-file" + LOREM,
            type: "string",
            stringLengthRange: [1, UPPER],
            required: true
        },
        {
            name: "requires-another",
            description: LOREM,
            type: "string",
            required: true,
            implies: ["required-by-another"]
        },
        {
            name: "required-by-another",
            description: "This is required with --required-by-another",
            type: "boolean"
        },
        {
            name: "conflicts-with-another",
            description: "This conflicts with another parameter",
            type: "string"
        },
        {
            name: "conflicts-with",
            description: "This will cause a conflicts with error",
            type: "string",
            conflictsWith: ["conflicts-with-another"]
        },
        {
            name: "invalid-regex",
            description: "This will cause an invalid regex syntax error",
            type: "string"
        },
        {
            name: "empty-value",
            description: "This will cause an empty value error " + LOREM,
            type: "string"
        },
        {
            name: "allowable-error",
            description: "This will cause an allowable option error " + LOREM,
            type: "string",
            allowableValues: {
                values: ["ABC", "123"]
            }
        }
    ]
};
