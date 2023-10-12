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

import { ICommandDefinition } from "../../../../../../../lib/index";

export const profileMappingCommand: ICommandDefinition = {
    name: "mapping",
    description: "Tests Imperative's profile to CLI mapping capabilities.",
    type: "command",
    handler: __dirname + "/ProfileMapping.handler",
    options:
        [
            {
                name: "color",
                aliases: ["c"],
                description: "The color of the banana.",
                type: "string",
                required: true,
            },
            {
                name: "banana-description",
                aliases: ["bd"],
                description: "A description of the banana",
                type: "string",
                required: true
            },
            {
                name: "mold-type",
                aliases: ["mt"],
                description: "The type of mold on the banana if any",
                type: "string",
                required: true
            },
            {
                name: "sweetness",
                aliases: ["s"],
                description: "The sweetness of the banana",
                type: "string",
                required: true,
                defaultValue: "mild"
            },
            {
                name: "ripe",
                aliases: ["r"],
                description: "Is the banana ripe?",
                type: "boolean"
            },
            {
                name: "sides",
                type: "number",
                description: "Number of sides on the banana"
            },
            {
                name: "names",
                type: "array",
                description: "The names that this banana is known by"
            }
        ],
    profile: {optional: ["banana"]}
};
