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

import { ICommandOptionDefinition, ICommandExampleDefinition, SessConstants } from "@zowe/imperative";

/**
 * Class to contain  constants
 * @export
 * @class Constants
 */
export class Constants {

    /**
     * Custom log location to prevent logging to default folder based on the package name
     * @static
     * @memberof Constants
     */
    public static readonly LOG_LOCATION = "zowe/logs/zowe.log";

    /**
     * Display name
     * @static
     * @memberof Constants
     */
    public static readonly DISPLAY_NAME = "Zowe CLI";

    /**
     * Binary executable name
     * @static
     * @memberof Constants
     */
    public static readonly BINARY_NAME = "zowe";

    /**
     *
     * Documentation link for the CLI
     * @static
     * @memberof Constants
     */
    public static readonly DOCUMENTATION_LINK = "https://docs.zowe.org";

    /**
     *
     * Support link for zowe
     * @static
     * @memberof Constants
     */
    public static readonly SUPPORT_LINK = "https://www.zowe.org";

    /**
     * Description of product
     * @static
     * @memberof Constants
     */
    public static readonly DESCRIPTION =
    `Welcome to ${Constants.DISPLAY_NAME}!

${Constants.DISPLAY_NAME} is a command line interface (CLI) that provides a simple and streamlined way to interact with IBM z/OS.

For additional ${Constants.DISPLAY_NAME} documentation, visit ${Constants.DOCUMENTATION_LINK}

For ${Constants.DISPLAY_NAME} support, visit ${Constants.SUPPORT_LINK}
`;

    /**
     * Home environment variable
     * @static
     * @memberof Constants
     */
    public static readonly HOME_ENV_KEY = "ZOWE_CLI_HOME";


    /**
     * Prefix for environmental variable settings used by Imperative
     * @static
     * @memberof Constants
     */
    public static readonly ENV_PREFIX = "ZOWE";


    /**
     * Home directory
     * @static
     * @memberof Constants
     */
    public static readonly HOME_DIR = "~/.zowe";

    public static BASE_CONNECTION_OPTION_GROUP = "Base Connection Options";

    /**
     * Option used in profile creation and commands for hostname
     */
    public static BASE_OPTION_HOST: ICommandOptionDefinition = {
        name: "host",
        aliases: ["H"],
        description: "Host name of service on the mainframe.",
        type: "string",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port
     */
    public static BASE_OPTION_PORT: ICommandOptionDefinition = {
        name: "port",
        aliases: ["P"],
        description: "Port number of service on the mainframe.",
        type: "number",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for username / ID
     */
    public static BASE_OPTION_USER: ICommandOptionDefinition = {
        name: "user",
        aliases: ["u"],
        description: "User name to authenticate to service on the mainframe.",
        type: "string",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase
     */
    public static BASE_OPTION_PASSWORD: ICommandOptionDefinition = {
        name: "password",
        aliases: ["pass", "pw"],
        description: "Password to authenticate to service on the mainframe.",
        type: "string",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
     */
    public static BASE_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
        name: "reject-unauthorized",
        aliases: ["ru"],
        description: "Reject self-signed certificates.",
        type: "boolean",
        defaultValue: true,
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenType
     */
    public static BASE_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        name: "token-type",
        aliases: ["tt"],
        description: "The type of token to get and use for the API. Omit this option to use the default token type, which is provided by " +
            "'zowe auth login'.",
        type: "string",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenValue to be used to interact with APIs
     */
    public static BASE_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
        name: "token-value",
        aliases: ["tv"],
        description: "The value of the token to pass to the API.",
        type: "string",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static BASE_OPTION_CERT_FILE: ICommandOptionDefinition = {
        name: "cert-file",
        description: "The file path to a certificate file to use for authentication",
        type: "existingLocalFile",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static BASE_OPTION_CERT_KEY_FILE: ICommandOptionDefinition = {
        name: "cert-key-file",
        description: "The file path to a certificate key file to use for authentication",
        type: "existingLocalFile",
        group: Constants.BASE_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    // public static BASE_OPTION_CERT_FILE_PASSPHRASE: ICommandOptionDefinition = {
    //     name: "cert-file-passphrase",
    //     description: "The passphrase to decrypt a certificate file to use for authentication",
    //     type: "string",
    //     group: Constants.BASE_CONNECTION_OPTION_GROUP
    // };


    public static readonly AUTO_INIT_OPTION_GROUP = "APIML Connection Options";

    /**
     * Option used in profile creation and commands for hostname
     */
    public static AUTO_INIT_OPTION_HOST: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_HOST,
        description: "Host name of the mainframe running the API Mediation Layer.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port
     */
    public static AUTO_INIT_OPTION_PORT: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_PORT,
        description: "Port number of API Mediation Layer on the mainframe.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for username / ID
     */
    public static AUTO_INIT_OPTION_USER: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_USER,
        description: "User name to authenticate to the API Mediation Layer on the mainframe.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase
     */
    public static AUTO_INIT_OPTION_PASSWORD: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_PASSWORD,
        description: "Password to authenticate to the API Mediation Layer on the mainframe.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
     */
    public static AUTO_INIT_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_REJECT_UNAUTHORIZED,
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenType
     */
    public static AUTO_INIT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_TOKEN_TYPE,
        description: "The type of token to get and use for the API Mediation Layer. " +
            "Omit this option to use the default token type, which is provided by 'zowe auth login'.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for tokenValue to be used to interact with APIs
     */
    public static AUTO_INIT_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_TOKEN_VALUE,
        description: "The value of the token to pass to the API Mediation Layer.",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static AUTO_INIT_OPTION_CERT_FILE: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_CERT_FILE,
        description: "The file path to a certificate file to use to authenticate to the API Mediation Layer",
        group: Constants.AUTO_INIT_OPTION_GROUP
    };

    /**
     * Option used to specify the path to the certificate file for authentication
     */
    public static AUTO_INIT_OPTION_CERT_KEY_FILE: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_CERT_KEY_FILE,
        description: "The file path to a certificate key file to use to authenticate to the API Mediation Layer",
        group: Constants.AUTO_INIT_OPTION_GROUP
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
    public static APIML_LOGOUT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        ...Constants.BASE_OPTION_TOKEN_TYPE,
        allowableValues: { values: SessConstants.ALL_TOKEN_TYPES }
    };
}
