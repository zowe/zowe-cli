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

import { ICommandOptionDefinition, IImperativeConfig } from "../../../../../lib/index";

const amountOption: ICommandOptionDefinition = {
    name: "amount",
    aliases: ["a"],
    description: "The amount of fruits.",
    type: "number"
};

const priceOption: ICommandOptionDefinition = {
    name: "price",
    aliases: ["p"],
    description: "The price of one fruit.",
    type: "number"
};

const hostOption: ICommandOptionDefinition = {
    name: "host",
    description: "Fruit host",
    type: "string"
};

const portOption: ICommandOptionDefinition = {
    name: "port",
    description: "Fruit port",
    type: "number"
};

const userOption: ICommandOptionDefinition = {
    name: "user",
    description: "Fruit username",
    type: "string"
};

const passwordOption: ICommandOptionDefinition = {
    name: "password",
    description: "Fruit password",
    type: "string"
};

const tokenTypeOption: ICommandOptionDefinition = {
    name: "token-type",
    description: "Fruit token type",
    type: "string"
};

const tokenValueOption: ICommandOptionDefinition = {
    name: "token-value",
    description: "Fruit token value",
    type: "string"
};

const certFileOption: ICommandOptionDefinition = {
    name: "cert-file",
    description: "Fruit certificate file",
    type: "existingLocalFile"
};

const certKeyFileOption: ICommandOptionDefinition = {
    name: "cert-key-file",
    description: "Fruit certificate key file",
    type: "existingLocalFile"
};

// Example to use with tsnode: */*CommandDefinitions!(.d).*s
export const config: IImperativeConfig = {
    commandModuleGlobs: ["**/cli/*/*definition!(.d).*s"],
    rootCommandDescription: "A test CLI for the 'cmd' imperative package",
    defaultHome: "~/.cmd-cli",
    productDisplayName: "Cmd Package CLI",
    envVariablePrefix: "CMD_CLI",
    name: "cmd-cli",
    allowConfigGroup: false,
    allowPlugins: false,
    baseProfile: {
        type: "base",
        schema: {
            type: "object",
            title: "Fruit Profile",
            description: "Fruit Profile",
            properties: {
                amount: {
                    type: "number",
                    optionDefinition: amountOption
                },
                price: {
                    type: "number",
                    optionDefinition: priceOption
                },
                host: {
                    type: "string",
                    optionDefinition: hostOption
                },
                port: {
                    type: "number",
                    optionDefinition: portOption
                },
                user: {
                    type: "string",
                    optionDefinition: userOption,
                    secure: true
                },
                password: {
                    type: "string",
                    optionDefinition: passwordOption,
                    secure: true
                },
                tokenType: {
                    type: "string",
                    optionDefinition: tokenTypeOption
                },
                tokenValue: {
                    type: "string",
                    optionDefinition: tokenValueOption,
                    secure: true
                },
                certFile: {
                    type: "existingLocalFile",
                    optionDefinition: certFileOption
                },
                certKeyFile: {
                    type: "existingLocalFile",
                    optionDefinition: certKeyFileOption
                }
            },
        },
        authConfig: [
            {
                serviceName: "fruit",
                handler: __dirname + "/../cli/auth/FruitAuthHandler",
                login: {
                    options: [
                        amountOption,
                        priceOption,
                        hostOption,
                        portOption,
                        userOption,
                        passwordOption,
                        certFileOption,
                        certKeyFileOption
                    ]
                },
                logout: {
                    options: [
                        amountOption,
                        priceOption,
                        hostOption,
                        portOption,
                        tokenTypeOption,
                        tokenValueOption
                    ]
                }
            }
        ]
    },
    profiles: [
        {
            type: "banana",
            schema: {
                type: "object",
                title: "Banana Profile",
                description: "Banana Profile",
                properties: {
                    "color": {
                        type: "string",
                        optionDefinition: {
                            name: "color",
                            aliases: ["c"],
                            description: "The color of the banana.",
                            type: "string",
                            required: true,
                        },
                    },
                    "bananaDescription": {
                        type: "string",
                        optionDefinition: {
                            name: "banana-description",
                            aliases: ["bd"],
                            description: "A description of the banana",
                            type: "string"
                        },
                    },
                    /**
                     * One option in kebab case to make sure fields are still mapped
                     */
                    "mold-type": {
                        type: "string",
                        optionDefinition: {
                            name: "mold-type",
                            aliases: ["mt"],
                            description: "The type of mold on the banana if any",
                            type: "string"
                        },
                    },
                },
                required: ["color"],
            }
        },
        {
            type: "strawberry",
            schema: {
                type: "object",
                title: "Strawberry Profile",
                description: "Strawberry Profile",
                properties: {
                    amount: {
                        type: "number",
                        optionDefinition: {
                            name: "amount",
                            aliases: ["a"],
                            description: "The amount of strawberries.",
                            type: "number",
                            required: true,
                        },
                    },
                },
                required: ["amount"],
            }
        },
        {
            type: "kiwi",
            schema: {
                type: "object",
                title: "Kiwi Profile",
                description: "Kiwi Profile",
                properties: {
                    amount: {
                        type: "number",
                        optionDefinition: {
                            name: "amount",
                            aliases: ["a"],
                            description: "The amount of kiwis.",
                            type: "number",
                        },
                    },
                    price: {
                        type: "number",
                        optionDefinition: {
                            name: "price",
                            aliases: ["p"],
                            description: "The price of one kiwi.",
                            type: "number",
                            defaultValue: 1
                        },
                    },
                    kiwiSecret: {
                        type: "string"
                    },
                },
            }
        },
        {
            type: "insecure",
            schema: {
                type: "object",
                title: "Test Secured Fields",
                description: "Test Secured Fields",
                properties: {
                    info: {
                        type: "string",
                        optionDefinition: {
                            name: "info",
                            description: "The info the keep in the profile.",
                            type: "string",
                            required: true,
                        }
                    },
                    secret: {
                        type: "string",
                        secure: true,
                        optionDefinition: {
                            name: "secret",
                            description: "The secret info the keep in the profile.",
                            type: "string",
                            required: true,
                        }
                    }
                }
            }
        }
    ]
};

module.exports = config;
