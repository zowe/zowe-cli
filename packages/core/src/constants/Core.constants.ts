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

import { ICommandExampleDefinition, ICommandOptionDefinition, ICommandProfileTypeConfiguration, SessConstants } from "@zowe/imperative";


/**
 * Class containing the various profile related constants
 */
export class ProfileConstants {
    public static readonly BASE_CONNECTION_OPTION_GROUP = "Base Connection Options";

    /**
     * Option used in profile creation and commands for hostname
     */
    public static readonly BASE_OPTION_HOST: ICommandOptionDefinition = {
        name: "host",
        aliases: ["H"],
        description: "Host name of service on the mainframe.",
        type: "string",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port
     */
    public static readonly BASE_OPTION_PORT: ICommandOptionDefinition = {
        name: "port",
        aliases: ["P"],
        description: "Port number of service on the mainframe.",
        type: "number",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for username / ID
     */
    public static readonly BASE_OPTION_USER: ICommandOptionDefinition = {
        name: "user",
        aliases: ["u"],
        description: "User name to authenticate to service on the mainframe.",
        type: "string",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase
     */
    public static readonly BASE_OPTION_PASSWORD: ICommandOptionDefinition = {
        name: "password",
        aliases: ["pass", "pw"],
        description: "Password to authenticate to service on the mainframe.",
        type: "string",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
     */
    public static readonly BASE_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
        name: "reject-unauthorized",
        aliases: ["ru"],
        description: "Reject self-signed certificates.",
        type: "boolean",
        defaultValue: true,
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenType
     */
    public static readonly BASE_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        name: "token-type",
        aliases: ["tt"],
        description: "The type of token to get and use for the API. Omit this option to use the default token type, which is provided by " +
        "'zowe auth login'.",
        type: "string",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenValue to be used to interact with APIs
     */
    public static readonly BASE_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
        name: "token-value",
        aliases: ["tv"],
        description: "The value of the token to pass to the API.",
        type: "string",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static readonly BASE_OPTION_CERT_FILE: ICommandOptionDefinition = {
        name: "cert-file",
        description: "The file path to a certificate file to use for authentication.\n\nNote: " +
        "The CLI does not support certificate files that require a password. " +
        "For more information, search Troubleshooting PEM Certificates in Zowe Docs.",
        type: "existingLocalFile",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static readonly BASE_OPTION_CERT_KEY_FILE: ICommandOptionDefinition = {
        name: "cert-key-file",
        description: "The file path to a certificate key file to use for authentication",
        type: "existingLocalFile",
        group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    // public static readonly BASE_OPTION_CERT_FILE_PASSPHRASE: ICommandOptionDefinition = {
    //     name: "cert-file-passphrase",
    //     description: "The passphrase to decrypt a certificate file to use for authentication",
    //     type: "string",
    //     group: ProfileConstants.BASE_CONNECTION_OPTION_GROUP
    // };


    public static readonly AUTO_INIT_OPTION_GROUP = "APIML Connection Options";

    /**
     * Option used in profile creation and commands for hostname
     */
    public static readonly AUTO_INIT_OPTION_HOST: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_HOST,
        description: "Host name of the mainframe running the API Mediation Layer.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port
     */
    public static readonly AUTO_INIT_OPTION_PORT: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_PORT,
        description: "Port number of API Mediation Layer on the mainframe.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for username / ID
     */
    public static readonly AUTO_INIT_OPTION_USER: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_USER,
        description: "User name to authenticate to the API Mediation Layer on the mainframe.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase
     */
    public static readonly AUTO_INIT_OPTION_PASSWORD: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_PASSWORD,
        description: "Password to authenticate to the API Mediation Layer on the mainframe.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
     */
    public static readonly AUTO_INIT_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_REJECT_UNAUTHORIZED,
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenType
     */
    public static readonly AUTO_INIT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_TOKEN_TYPE,
        description: "The type of token to get and use for the API Mediation Layer. " +
            "Omit this option to use the default token type, which is provided by 'zowe auth login'.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenValue to be used to interact with APIs
     */
    public static readonly AUTO_INIT_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_TOKEN_VALUE,
        description: "The value of the token to pass to the API Mediation Layer.",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for certificate file to be used to interact with login APIs
     */
    public static AUTO_INIT_OPTION_CERT_FILE: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_CERT_FILE,
        description: "The file path to a certificate file to use to authenticate to the API Mediation Layer",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for certificate key file to be used to interact with login APIs
     */
    public static AUTO_INIT_OPTION_CERT_KEY_FILE: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_CERT_KEY_FILE,
        description: "The file path to a certificate key file to use to authenticate to the API Mediation Layer",
        group: ProfileConstants.AUTO_INIT_OPTION_GROUP
    };


    /**
     * Summary of auth command group
     * @static
     * @memberof AuthConstants
     */
    public static readonly AUTH_GROUP_SUMMARY = "Connect to Zowe API ML authentication service";

    /**
     * Description of auth command group
     * @static
     * @memberof AuthConstants
     */
    public static readonly AUTH_GROUP_DESCRIPTION = "Connect to Zowe API Mediation Layer authentication service and obtain a token, or disconnect " +
        "from the authentication service and revoke the token.\n" +
        "\n" +
        "The token provides authentication to services that support the API ML SSO (Single Sign-On) capability. When you log in, the token is " +
        "stored in your default base profile until it expires. Base profiles store connection information shared by multiple services (e.g., " +
        "z/OSMF), and are used if you do not supply connection information in a service profile. To take advantage of the API ML SSO capability, " +
        "you should omit username and password in service profiles so that the token in the base profile is used.";

    /**
     * Summary of APIML login command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_SUMMARY = "Log in to API ML authentication service";

    /**
     * Description of APIML login command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_DESCRIPTION = "Log in to Zowe API Mediation Layer authentication service and obtain or update a token.\n" +
        "\n" +
        "The token provides authentication to services that support the API ML SSO (Single Sign-On) capability. When you log in, the token is " +
        "stored in your default base profile until it expires. Base profiles store connection information shared by multiple services (e.g., " +
        "z/OSMF), and are used if you do not supply connection information in a service profile. To take advantage of the API ML SSO capability, " +
        "you should omit username and password in service profiles so that the token in the base profile is used.";

    /**
     * Example definition for APIML login command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_EXAMPLE1: ICommandExampleDefinition = {
        description: "Log in to an API ML instance to obtain or update the token stored in your base profile",
        options: ""
    };

    /**
     * Example definition for APIML login command with show-token
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_EXAMPLE2: ICommandExampleDefinition = {
        description: "Log in to an API ML instance to obtain a token without storing it in a profile",
        options: "--show-token"
    };

    /**
     * Summary of APIML logout command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGOUT_SUMMARY = "Log out of API ML authentication service";

    /**
     * Description of APIML logout command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGOUT_DESCRIPTION = "Log out of the Zowe API Mediation Layer authentication service and revoke the token so it " +
        "can no longer authenticate. Also remove the token from the default base profile, if it is stored on disk.";

    /**
     * Example definition for APIML logout command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGOUT_EXAMPLE1: ICommandExampleDefinition = {
        description: "Log out of an API ML instance to revoke the token that was in use and remove it from your base profile",
        options: ""
    };

    /**
     * Example definition for APIML logout command with token-value
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGOUT_EXAMPLE2: ICommandExampleDefinition = {
        description: "Log out of an API ML instance to revoke a token that was not stored in a profile",
        options: "--token-value <token>"
    };

    /**
     * Option used in APIML logout command for token-type
     */
    public static readonly APIML_LOGOUT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        ...ProfileConstants.BASE_OPTION_TOKEN_TYPE,
        allowableValues: {
            values: SessConstants.ALL_TOKEN_TYPES
                .map(tk => tk.indexOf(SessConstants.TOKEN_TYPE_APIML) >= 0 ? `^${SessConstants.TOKEN_TYPE_APIML}.*` : tk)
        }
    };

    /**
     * Profile configuration for SSH profiles
     * @type {ICommandProfileTypeConfiguration}
     * @memberof BaseProfile
     */
    public static readonly BaseProfile: ICommandProfileTypeConfiguration = {
        type: "base",
        schema: {
            type: "object",
            title: "Base Profile",
            description: "Base profile that stores values shared by multiple service profiles",
            properties: {
                host: {
                    type: "string",
                    optionDefinition: ProfileConstants.BASE_OPTION_HOST,
                    includeInTemplate: true
                },
                port: {
                    type: "number",
                    optionDefinition: ProfileConstants.BASE_OPTION_PORT
                },
                user: {
                    type: "string",
                    secure: true,
                    optionDefinition: ProfileConstants.BASE_OPTION_USER,
                    includeInTemplate: true
                },
                password: {
                    type: "string",
                    secure: true,
                    optionDefinition: ProfileConstants.BASE_OPTION_PASSWORD,
                    includeInTemplate: true
                },
                rejectUnauthorized: {
                    type: "boolean",
                    optionDefinition: ProfileConstants.BASE_OPTION_REJECT_UNAUTHORIZED,
                    includeInTemplate: true
                },
                tokenType: {
                    type: "string",
                    optionDefinition: ProfileConstants.BASE_OPTION_TOKEN_TYPE
                },
                tokenValue: {
                    type: "string",
                    secure: true,
                    optionDefinition: ProfileConstants.BASE_OPTION_TOKEN_VALUE
                },
                certFile: {
                    type: "string",
                    optionDefinition: ProfileConstants.BASE_OPTION_CERT_FILE
                },
                certKeyFile: {
                    type: "string",
                    optionDefinition: ProfileConstants.BASE_OPTION_CERT_KEY_FILE
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
        ]
    };
}
