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

import { ICommandOptionDefinition } from "@zowe/imperative";

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
        defaultValue: 443,
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
}
