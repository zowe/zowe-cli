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

import { ICommandOptionDefinition, ICommandProfileTypeConfiguration } from "@zowe/imperative";
import {
    APIML_LOGIN_DESCRIPTION,
    APIML_LOGIN_EXAMPLE1,
    APIML_LOGIN_EXAMPLE2,
    APIML_LOGIN_SUMMARY,
    APIML_LOGOUT_DESCRIPTION,
    APIML_LOGOUT_EXAMPLE1,
    APIML_LOGOUT_EXAMPLE2,
    APIML_LOGOUT_OPTION_TOKEN_TYPE,
    APIML_LOGOUT_SUMMARY
} from "../apiml/ApimlConstants";

export const BASE_CONNECTION_OPTION_GROUP = "Base Connection Options";

/**
 * Option used in profile creation and commands for hostname
 */
export const BASE_OPTION_HOST: ICommandOptionDefinition = {
    name: "host",
    aliases: ["H"],
    description: "Host name of service on the mainframe.",
    type: "string",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for port
 */
export const BASE_OPTION_PORT: ICommandOptionDefinition = {
    name: "port",
    aliases: ["P"],
    description: "Port number of service on the mainframe.",
    type: "number",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for username / ID
 */
export const BASE_OPTION_USER: ICommandOptionDefinition = {
    name: "user",
    aliases: ["u"],
    description: "User name to authenticate to service on the mainframe.",
    type: "string",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for password/passphrase
 */
export const BASE_OPTION_PASSWORD: ICommandOptionDefinition = {
    name: "password",
    aliases: ["pass", "pw"],
    description: "Password to authenticate to service on the mainframe.",
    type: "string",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
 */
export const BASE_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
    name: "reject-unauthorized",
    aliases: ["ru"],
    description: "Reject self-signed certificates.",
    type: "boolean",
    defaultValue: true,
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for tokenType
 */
export const BASE_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
    name: "token-type",
    aliases: ["tt"],
    description: "The type of token to get and use for the API. Omit this option to use the default token type, which is provided by " +
    "'zowe auth login'.",
    type: "string",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for tokenValue to be used to interact with APIs
 */
export const BASE_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
    name: "token-value",
    aliases: ["tv"],
    description: "The value of the token to pass to the API.",
    type: "string",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used to specify the path to the certificate file for authentication
 */
export const BASE_OPTION_CERT_FILE: ICommandOptionDefinition = {
    name: "cert-file",
    description: "The file path to a certificate file to use for authentication",
    type: "existingLocalFile",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used to specify the path to the certificate file for authentication
 */
export const BASE_OPTION_CERT_KEY_FILE: ICommandOptionDefinition = {
    name: "cert-key-file",
    description: "The file path to a certificate key file to use for authentication",
    type: "existingLocalFile",
    group: BASE_CONNECTION_OPTION_GROUP
};

/**
 * Option used to specify the path to the certificate file for authentication
 */
// export const BASE_OPTION_CERT_FILE_PASSPHRASE: ICommandOptionDefinition = {
//     name: "cert-file-passphrase",
//     description: "The passphrase to decrypt a certificate file to use for authentication",
//     type: "string",
//     group: BASE_CONNECTION_OPTION_GROUP
// };

/**
 * Profile configuration for SSH profiles
 * @type {ICommandProfileTypeConfiguration}
 * @memberof BaseProfile
 */
export const BaseProfile: ICommandProfileTypeConfiguration = {
    type: "base",
    schema: {
        type: "object",
        title: "Base Profile",
        description: "Base profile that stores values shared by multiple service profiles",
        properties: {
            host: {
                type: "string",
                optionDefinition: BASE_OPTION_HOST,
                includeInTemplate: true
            },
            port: {
                type: "number",
                optionDefinition: BASE_OPTION_PORT
            },
            user: {
                type: "string",
                secure: true,
                optionDefinition: BASE_OPTION_USER,
                includeInTemplate: true
            },
            password: {
                type: "string",
                secure: true,
                optionDefinition: BASE_OPTION_PASSWORD,
                includeInTemplate: true
            },
            rejectUnauthorized: {
                type: "boolean",
                optionDefinition: BASE_OPTION_REJECT_UNAUTHORIZED,
                includeInTemplate: true
            },
            tokenType: {
                type: "string",
                optionDefinition: BASE_OPTION_TOKEN_TYPE
            },
            tokenValue: {
                type: "string",
                secure: true,
                optionDefinition: BASE_OPTION_TOKEN_VALUE
            },
            certFile: {
                type: "string",
                optionDefinition: BASE_OPTION_CERT_FILE
            },
            certKeyFile: {
                type: "string",
                optionDefinition: BASE_OPTION_CERT_KEY_FILE
                // },
                // certFilePassphrase: {
                //     type: "string",
                //     secure: true,
                //     optionDefinition: BASE_OPTION_CERT_FILE_PASSPHRASE
            }
        },
        required: []
    },
    createProfileExamples: [
        {
            options: "base1 --host example.com --port 443 --user admin --password 123456",
            description: "Create a profile called 'base1' to connect to host example.com and port 443"
        },
        {
            options: "base2 --host example.com --user admin --password 123456 --reject-unauthorized false",
            description: "Create a profile called 'base2' to connect to host example.com (default port - 443) " +
        "and allow self-signed certificates"
        },
        {
            options: "base3 --host example.com --port 1443",
            description: "Create a profile called 'base3' to connect to host example.com and port 1443, " +
        " not specifying a username or password so they are not stored on disk; these will need to be specified on every command"
        },
        {
            options: "base4 --reject-unauthorized false",
            description: "Create a zosmf profile called 'base4' to connect to default port 443 and allow self-signed certificates, " +
        "not specifying a username, password, or host so they are not stored on disk; these will need to be specified on every command"
        }
    ],
    updateProfileExamples: [
        {
            options: "base1 --user newuser --password newp4ss",
            description: "Update a base profile named 'base1' with a new username and password"
        }
    ],
    authConfig: [
        {
            serviceName: "apiml",
            handler: __dirname + "/auth/ApimlAuthHandler",
            login: {
                summary: APIML_LOGIN_SUMMARY,
                description: APIML_LOGIN_DESCRIPTION,
                examples: [
                    APIML_LOGIN_EXAMPLE1,
                    APIML_LOGIN_EXAMPLE2
                ],
                options: [
                    BASE_OPTION_HOST,
                    BASE_OPTION_PORT,
                    BASE_OPTION_USER,
                    BASE_OPTION_PASSWORD,
                    BASE_OPTION_REJECT_UNAUTHORIZED,
                    BASE_OPTION_CERT_FILE,
                    BASE_OPTION_CERT_KEY_FILE
                ]
            },
            logout: {
                summary: APIML_LOGOUT_SUMMARY,
                description: APIML_LOGOUT_DESCRIPTION,
                examples: [
                    APIML_LOGOUT_EXAMPLE1,
                    APIML_LOGOUT_EXAMPLE2
                ],
                options: [
                    BASE_OPTION_HOST,
                    BASE_OPTION_PORT,
                    APIML_LOGOUT_OPTION_TOKEN_TYPE,
                    BASE_OPTION_TOKEN_VALUE,
                    BASE_OPTION_REJECT_UNAUTHORIZED
                ]
            }
        }
    ]
};
