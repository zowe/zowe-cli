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

import { ICommandExampleDefinition, ICommandOptionDefinition, ICommandProfileTypeConfiguration, TOKEN_TYPE_APIML, ALL_TOKEN_TYPES } from "@zowe/imperative";


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
        description: "The file path to a certificate file to use for authentication",
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
        ],
        updateProfileExamples: [
            {
                options: "base1 --user newuser --password newp4ss",
                description: "Update a base profile named 'base1' with a new username and password"
            }
        ]
    };
}

/**
 * Imperative constants
 * @export
 * @class Constants
 */
export class Constants {
    public static readonly FRAMEWORK_DISPLAY_NAME: string = "Imperative";
    public static readonly IMPERATIVE_DEFAULT_HOME: string = "IMPERATIVE_HOME";
    public static readonly IMPERATIVE_DIRECTORY: string = ".imperative";

    public static readonly ERROR_EXIT_CODE: number = 1;

    public static readonly PRIMARY_COMMAND: string = "imperative";

    public static readonly PROFILES_DIR: string = "/profiles";

    /**
     * Syntax diagram
     */
    public static readonly COMMAND_SEGMENT: string = "[command]";
    public static readonly GROUP_SEGMENT: string = "[group]";
    public static readonly OPTIONS_SEGMENT: string = "[options]";

    /**
     * Explanation of experimental features to be used in various places around the CLI
     * @type {string}
     */
    public static readonly DEFAULT_EXPERIMENTAL_COMMAND_EXPLANATION: string =
        "Experimental commands are commands that are not ready for general availability. If you " +
        "decide to use these commands, you might encounter bugs, incompatibilities with your system, " +
        "or incomplete help text. ";
    /**
     * Segments
     */
    public static readonly PRIMARY_SEGMENT_NUMBER: number = 1;
    public static readonly GROUP_SEGMENT_NUMBER: number = 2;

    public static readonly DEFAULT_SET_PROFILE_OBJECT = "default-profiles";
    public static readonly DEFAULT_SET_PROFILE_OBJECT_ALIAS = "dbp";
    public static readonly DEFAULT_SET_GROUP = "set";

    public static readonly DEFAULT_LIST_PROFILE_OBJECT = "loaded-profiles";
    public static readonly DEFAULT_LIST_PROFILE_OBJECT_ALIAS = "lbp";
    public static readonly DEFAULT_LIST_GROUP = "list";

    public static GLOBAL_GROUP = "Global Options";
    public static readonly JSON_OPTION = "response-format-json";
    public static readonly JSON_OPTION_ALIAS = "rfj";
    public static readonly HELP_OPTION = "help";
    public static readonly HELP_OPTION_ALIAS = "h";
    public static readonly HELP_EXAMPLES = "help-examples";
    public static readonly HELP_WEB_OPTION = "help-web";
    public static readonly HELP_WEB_OPTION_ALIAS = "hw";

    public static readonly STDIN_OPTION = "stdin";
    public static readonly STDIN_OPTION_ALIAS = "pipe";
    public static readonly STDIN_DEFAULT_DESCRIPTION = "Pipe data into this command via stdin";

    public static readonly OPT_LONG_DASH = "--";
    public static readonly OPT_SHORT_DASH = "-";

    /**
     * If you use the stdin option, you will be able to access the contents buffer
     * through this key on your Arguments object in your command
     * @type {string}
     */
    public static readonly STDIN_CONTENT_KEY: string = "stdin-content";

    /**
     * Create profile constants
     */
    public static readonly CREATE_ACTION = "create";
    public static readonly PROFILE_GROUP = "profiles";
    public static readonly PROFILE_OBJECT = "profile";
    public static readonly PROFILE_ALIASES: string[] = ["profile", "pr"];
    public static readonly PROFILE_NAME_OPTION = "profileName";
    public static readonly PROFILE_NAME_OPTION_ALIAS = "pn";
    public static readonly OVERWRITE_OPTION = "overwrite";
    public static readonly DISABLE_DEFAULTS_OPTION = "disable-defaults";
    public static readonly DELETE_ACTION = "delete";
    public static readonly DETAILS_ACTION = "detail";
    public static readonly SHOW_DEPS_ACTION = "show-dependencies";
    public static readonly VALIDATE_ACTION = "validate";
    public static readonly UPDATE_ACTION = "update";
    public static readonly LIST_ACTION = "list";
    public static readonly PROFILE_SET_OPTION_ALIAS = `{{typeLetter}}n`;
    public static readonly SET_ACTION = "set-default";
    public static readonly PROFILE_DELETE_PROFILE_DEPS = "delete-dependent-profiles";
    public static readonly PROFILE_DELETE_PROFILE_DEPS_ALIAS = "ddp";

    public static readonly DEFAULT_HIGHLIGHT_COLOR = "yellow";
    public static readonly DEFAULT_PROMPT_PHRASE = "PROMPT*";
    public static readonly DEFAULT_MASK_OUTPUT = "TRUE";

    public static readonly WEB_HELP_DIR = "web-help";
    public static readonly WEB_DIFF_DIR = "web-diff";


    /**
     * Auth group constants
     */
    public static readonly AUTH_GROUP = "auth";
    public static readonly LOGIN_ACTION = "login";
    public static readonly LOGIN_ACTION_ALIAS = "li";
    public static readonly LOGOUT_ACTION = "logout";
    public static readonly LOGOUT_ACTION_ALIAS = "lo";

    /**
     * Auto Init constants
     */
    public static readonly AUTO_INIT_ACTION = "auto-init";
}
