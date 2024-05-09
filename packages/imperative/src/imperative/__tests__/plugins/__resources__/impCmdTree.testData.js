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
    name: "",
    description: "Sample command line interface",
    type: "group",
    children: [
        {
            name: "goodbye",
            type: "group",
            description: "goodbye commands",
            children: [
                {
                    name: "friend",
                    aliases: [
                        "bud"
                    ],
                    description: "Writes goodbye",
                    type: "command",
                    handler: "C:\\SomePathTo\\imperative-sample\\lib\\commands\\goodbye/Handler",
                    options: [
                        {
                            name: "name",
                            aliases: [
                                "n"
                            ],
                            description: "Name of friend",
                            type: "string",
                            group: "Options"
                        },
                        {
                            name: "response-format-json",
                            aliases: [
                                "y"
                            ],
                            group: "Global options",
                            description: "Produce the command response as a JSON document",
                            type: "boolean"
                        },
                        {
                            name: "help",
                            aliases: [
                                "h"
                            ],
                            group: "Global options",
                            description: "Display help text",
                            type: "boolean"
                        }
                    ],
                    positionals: [],
                    children: []
                }
            ],
            options: [
                {
                    name: "response-format-json",
                    aliases: [
                        "y"
                    ],
                    group: "Global options",
                    description: "Produce the command response as a JSON document",
                    type: "boolean"
                },
                {
                    name: "help",
                    aliases: [
                        "h"
                    ],
                    group: "Global options",
                    description: "Display help text",
                    type: "boolean"
                }
            ],
            aliases: [],
            positionals: []
        },
        {
            name: "hello",
            type: "group",
            description: "hello commands",
            children: [
                {
                    name: "friend",
                    aliases: [
                        "bud"
                    ],
                    description: "Writes hello",
                    type: "command",
                    handler: "C:\\SomePathTo\\imperative-sample\\lib\\commands\\hello/Handler",
                    options: [
                        {
                            name: "response-format-json",
                            aliases: [
                                "y"
                            ],
                            group: "Global options",
                            description: "Produce the command response as a JSON document",
                            type: "boolean"
                        },
                        {
                            name: "help",
                            aliases: [
                                "h"
                            ],
                            group: "Global options",
                            description: "Display help text",
                            type: "boolean"
                        }
                    ],
                    positionals: [],
                    children: []
                }
            ],
            options: [
                {
                    name: "response-format-json",
                    aliases: [
                        "y"
                    ],
                    group: "Global options",
                    description: "Produce the command response as a JSON document",
                    type: "boolean"
                },
                {
                    name: "help",
                    aliases: [
                        "h"
                    ],
                    group: "Global options",
                    description: "Display help text",
                    type: "boolean"
                }
            ],
            aliases: [],
            positionals: []
        }
    ]
};
