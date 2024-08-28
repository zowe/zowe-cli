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

import { IImperativeConfig } from "../../../../src/imperative";

const config: IImperativeConfig = {
    definitions: [
        {
            name: "log",
            description: "Log example messages",
            type: "group",
            children: [
                {
                    name: "messages",
                    description: "Log example messages",
                    type: "command",
                    handler: __dirname + "/handlers/LogMessagesHandler",
                    options: [
                        {
                            name: "level",
                            allowableValues: {values: ["trace", "debug", "info", "warn", "error", "fatal"]},
                            type: "string",
                            description: "The level to log messages at.",
                            required: true
                        }
                    ]
                }
            ]
        }
    ],
    commandModuleGlobs: ["../with_bin_package/definitions/*/*Definition.ts"],
    rootCommandDescription: "Sample command line interface",
    defaultHome: __dirname + "/../../../__results__/.examplewithprofiles",
    // defaultHome: createUniqueTestDataDir(),
    productDisplayName: "Test CLI with Profiles",
    name: "example_with_bin",
    profiles: [{
        type: "profile-a",
        schema: {
            type: "object",
            title: "Example profile type A",
            description: "Example profile type A",
            properties: {
                animal: {
                    optionDefinition: {
                        description: "The animal",
                        type: "string",
                        name: "animal", aliases: ["a"],
                        required: true
                    },
                    type: "number",
                },
            },
            required: ["age"]
        }
    }]
};

module.exports = config;
