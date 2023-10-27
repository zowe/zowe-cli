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

import { ICommandOptionDefinition, IImperativeConfig } from "../../../../lib/index";

const infoOption: ICommandOptionDefinition = {
    name: "info",
    description: "The info the keep in the profile.",
    type: "string"
};

const secretOption: ICommandOptionDefinition = {
    name: "secret",
    description: "The secret info the keep in the profile.",
    type: "string"
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

// Example to use with tsnode: */*CommandDefinitions!(.d).*s
export const config: IImperativeConfig = {
    commandModuleGlobs: ["**/cli/*/*definition!(.d).*s"],
    rootCommandDescription: "A test CLI for the 'imperative' imperative package",
    defaultHome: "~/.imperative-test-cli",
    productDisplayName: "Imperative Package Test CLI",
    name: "imperative-test-cli",
    envVariablePrefix: "IMPERATIVE_TEST_CLI",
    allowPlugins: false,
    configAutoInitCommandConfig: {
        handler: __dirname + "/cli/config/FruitAutoInitHandler",
        provider: "Fruit Manager",
        autoInit: {
            options: [
                hostOption,
                portOption,
                userOption,
                passwordOption,
                tokenTypeOption,
                tokenValueOption
            ]
        },
        profileType: "base"
    },
    profiles: [
        {
            type: "secured",
            schema: {
                type: "object",
                title: "Test Secured Fields",
                description: "Test Secured Fields",
                properties: {
                    info: {
                        type: "string",
                        includeInTemplate: true,
                        optionDefinition: {...infoOption, required: true}
                    },
                    secret: {
                        type: "string",
                        secure: true,
                        optionDefinition: {...secretOption, required: true}
                    }
                }
            }
        }
    ],
    baseProfile: {
        type: "base",
        schema: {
            type: "object",
            title: "Secure Profile",
            description: "Secure Profile",
            properties: {
                info: {
                    type: "string",
                    optionDefinition: infoOption
                },
                secret: {
                    type: "string",
                    secure: true,
                    includeInTemplate: true,
                    optionDefinition: secretOption
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
                }
            },
        },
        authConfig: [
            {
                serviceName: "fruit",
                handler: __dirname + "/cli/auth/FruitAuthHandler",
                login: {
                    options: [
                        infoOption,
                        secretOption,
                        hostOption,
                        portOption,
                        userOption,
                        passwordOption
                    ]
                },
                logout: {
                    options: [
                        infoOption,
                        secretOption,
                        hostOption,
                        portOption,
                        tokenTypeOption,
                        tokenValueOption
                    ]
                }
            }
        ]
    },
};

module.exports = config;
