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

module.exports = {
    definitions: [
        {
            name: "pick",
            description: "Pick fruit",
            type: "group",
            children: [
                {
                    name: "pineapple",
                    description: "Pick a pineapple",
                    type: "command",
                    handler: "C:\\SomePathTo\\imperative-sample\\lib\\imperative/../commands/pick/PickPineappleHandler"
                }
            ]
        }
    ],
    commandModuleGlobs: [
        "**/Definition.js"
    ],
    rootCommandDescription: "Sample command line interface",
    defaultHome: "C:\\Users\\SomeUserId/.sample-cli",
    productDisplayName: "Sample CLI",
    primaryTextColor: "blue",
    name: "sample-cli",
    logging: {
        additionalLogging: [
            {
                apiName: "another"
            },
            {
                apiName: "yetAnother",
                logFile: "a/different/place/here.log"
            }
        ]
    },
    secondaryTextColor: "yellow",
    profiles: [
        {
            type: "banana",
            schema: {
                type: "object",
                title: "The Banana command profile schema",
                description: "The Banana command profile schema",
                properties: {
                    age: {
                        optionDefinition: {
                            description: "The age of the Banana",
                            type: "number",
                            name: "age",
                            aliases: [
                                "a"
                            ],
                            required: true
                        },
                        type: "number"
                    },
                    color: {
                        optionDefinition: {
                            description: "The color of the Banana",
                            type: "string",
                            name: "color",
                            aliases: [
                                "c"
                            ],
                            required: false,
                            defaultValue: "yellow"
                        },
                        type: "string"
                    }
                },
                required: [
                    "age",
                    "color"
                ]
            },
            validationPlanModule: "C:\\SomePathTo\\imperative-sample\\lib\\profiles\\banana/BananaProfileValidationPlan"
        },
        {
            type: "strawberry",
            schema: {
                type: "object",
                title: "The strawberry command profile schema",
                description: "The strawberry command profile schema",
                properties: {
                    age: {
                        optionDefinition: {
                            description: "Amount of strawberries",
                            type: "number",
                            name: "amount",
                            aliases: [
                                "a"
                            ],
                            required: true
                        },
                        type: "number"
                    },
                    ripe: {
                        optionDefinition: {
                            description: "The strawberries are ripe",
                            type: "boolean",
                            name: "ripe",
                            aliases: [
                                "r"
                            ],
                            required: true
                        },
                        type: "boolean"
                    }
                },
                required: [
                    "age",
                    "ripe"
                ]
            }
        },
        {
            type: "bunch",
            schema: {
                type: "object",
                title: "The fruit bunch",
                description: "The fruit bunch schema",
                properties: {},
                required: []
            },
            dependencies: [
                {
                    type: "banana",
                    required: true
                },
                {
                    type: "strawberry",
                    required: true
                }
            ]
        }
    ],
    progressBarSpinner: ".oO0Oo."
};
