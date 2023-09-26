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

import { IImperativeConfig } from "../../../../packages/imperative";

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
        },
        {
            name: "use-profile-a",
            description: "Use a profile of type A",
            type: "command",
            profile: {
                required: ["profile-a"]
            },
            handler: __dirname + "/handlers/UseProfileAHandler"
        },
        {
            name: "use-profile-b",
            description: "Use a profile of type B",
            type: "command",
            profile: {
                required: ["profile-b"]
            },
            handler: __dirname + "/handlers/UseProfileBHandler"
        },
        {
            name: "optional-profile-c",
            description: "Use a profile of type C",
            type: "command",
            profile: {
                optional: ["profile-c"]
            },
            handler: __dirname + "/handlers/OptionalProfileCHandler"
        },
        {
            name: "use-dependent-profile",
            description: "Use a profile of type profile-with-dependency",
            type: "command",
            profile: {
                required: ["profile-with-dependency"]
            },
            handler: __dirname + "/handlers/UseDependentProfileHandler"
        }
    ],
    commandModuleGlobs: ["definitions/*/*Definition.ts"],
    rootCommandDescription: "Sample command line interface",
    defaultHome: __dirname + "/../../../__results__/.examplewithprofiles",
    // defaultHome: createUniqueTestDataDir(),
    productDisplayName: "Test CLI with Profiles",
    name: "example_with_profiles",
    profiles: [
        {
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
                        type: "string",
                    },
                    numberWithDefault: {
                        optionDefinition: {
                            defaultValue: 8080,
                            name: "number-with-default",
                            type: "number",
                            description: "A number field with default value",
                        },
                        type: "number"
                    }
                },
                required: ["animal", "numberWithDefault"]
            },
            createProfileExamples: [
                {
                    options: "--animal doggy",
                    description: "Create a profile-a profile with a doggy as the animal"
                }
            ],
            updateProfileExamples: [
                {
                    options: "--animal froggy",
                    description: "Update a profile-a profile to use froggy as the animal"
                }
            ]
        },
        {
            type: "profile-b",
            schema: {
                type: "object",
                title: "Example profile type B",
                description: "Example profile type B",
                properties: {
                    bumblebee: {
                        optionDefinition: {
                            description: "The bumblebee",
                            type: "string",
                            name: "bumblebee", aliases: ["b"],
                            required: true
                        },
                        type: "string",
                    },
                },
                required: ["bumblebee"]
            },
        },
        {
            type: "profile-c",
            schema: {
                type: "object",
                title: "Example profile type C",
                description: "Example profile type C",
                properties: {
                    animal: {
                        optionDefinition: {
                            description: "The animal",
                            type: "string",
                            name: "animal", aliases: ["a"],
                            required: true
                        },
                        type: "string",
                    },
                },
                required: ["animal"]
            },
        },
        {
            type: "profile-with-dependency",
            schema: {
                type: "object",
                title: "Example profile with dependent profiles",
                description: "Example profile type with dependent profiles",
                properties: {
                    ghost: {
                        optionDefinition: {
                            description: "The ghost",
                            type: "string",
                            name: "ghost", aliases: ["g"],
                            required: true
                        },
                        type: "string",
                    },
                },
                required: ["ghost", "dependencies"]
            },
            dependencies: [{
                description: "The profile-a profile to use as a dependency.",
                type: "profile-a",
                required: true
            }]
        },
        {
            type: "many-field-profile",
            validationPlanModule: __dirname + "/plans/ManyFieldValidationPlan",
            schema: {
                type: "object",
                title: "Example profile with multiple fields",
                description: "Example profile type with multiple fields",
                properties: {
                    tea: {
                        optionDefinition: {
                            description: "The tea",
                            type: "string",
                            name: "tea", aliases: ["t"],
                            required: true
                        },
                        type: "string",
                    },
                    soda: {
                        optionDefinition: {
                            description: "The soda",
                            type: "string",
                            name: "soda", aliases: ["s"],
                            required: true
                        },
                        type: "string",
                    },
                    water: {
                        optionDefinition: {
                            description: "The water",
                            type: "string",
                            name: "water", aliases: ["w"],
                            required: true
                        },
                        type: "string",
                    },
                },
                required: ["tea", "soda", "water"]
            },
        }]
};

export = config;
