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

import { ICommandExampleDefinition, ICommandOptionDefinition, SessConstants } from "@zowe/imperative";
import {
    BASE_OPTION_HOST,
    BASE_OPTION_PASSWORD,
    BASE_OPTION_PORT,
    BASE_OPTION_REJECT_UNAUTHORIZED,
    BASE_OPTION_TOKEN_TYPE,
    BASE_OPTION_TOKEN_VALUE,
    BASE_OPTION_USER
} from "../constants/Core.constants";

/**
 * Class for various APIML constants.
 * @export
 * @class ApimlConstants
 */
export class ApimlConstants {
    /**
     * URI for listing APIML services
     * @static
     * @type {string}
     * @memberof ApimlConstants
     */
    public static readonly SERVICES_ENDPOINT: string = "/gateway/api/v1/services";
}

export const AUTO_INIT_OPTION_GROUP = "APIML Connection Options";

/**
 * Option used in profile creation and commands for hostname
 */
export const AUTO_INIT_OPTION_HOST: ICommandOptionDefinition = {
    ...BASE_OPTION_HOST,
    description: "Host name of the mainframe running the API Mediation Layer.",
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for port
 */
export const AUTO_INIT_OPTION_PORT: ICommandOptionDefinition = {
    ...BASE_OPTION_PORT,
    description: "Port number of API Mediation Layer on the mainframe.",
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for username / ID
 */
export const AUTO_INIT_OPTION_USER: ICommandOptionDefinition = {
    ...BASE_OPTION_USER,
    description: "User name to authenticate to the API Mediation Layer on the mainframe.",
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for password/passphrase
 */
export const AUTO_INIT_OPTION_PASSWORD: ICommandOptionDefinition = {
    ...BASE_OPTION_PASSWORD,
    description: "Password to authenticate to the API Mediation Layer on the mainframe.",
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
 */
export const AUTO_INIT_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
    ...BASE_OPTION_REJECT_UNAUTHORIZED,
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for tokenType
 */
export const AUTO_INIT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
    ...BASE_OPTION_TOKEN_TYPE,
    description: "The type of token to get and use for the API Mediation Layer. " +
        "Omit this option to use the default token type, which is provided by 'zowe auth login'.",
    group: AUTO_INIT_OPTION_GROUP
};

/**
 * Option used in profile creation and commands for tokenValue to be used to interact with APIs
 */
export const AUTO_INIT_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
    ...BASE_OPTION_TOKEN_VALUE,
    description: "The value of the token to pass to the API Mediation Layer.",
    group: AUTO_INIT_OPTION_GROUP
};


/**
 * Summary of auth command group
 * @static
 * @memberof AuthConstants
 */
export const AUTH_GROUP_SUMMARY = "Connect to Zowe API ML authentication service";

/**
  * Description of auth command group
  * @static
  * @memberof AuthConstants
  */
export const AUTH_GROUP_DESCRIPTION = "Connect to Zowe API Mediation Layer authentication service and obtain a token, or disconnect " +
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
export const APIML_LOGIN_SUMMARY = "Log in to API ML authentication service";

/**
  * Description of APIML login command
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGIN_DESCRIPTION = "Log in to Zowe API Mediation Layer authentication service and obtain or update a token.\n" +
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
export const APIML_LOGIN_EXAMPLE1: ICommandExampleDefinition = {
    description: "Log in to an API ML instance to obtain or update the token stored in your base profile",
    options: ""
};

/**
  * Example definition for APIML login command with show-token
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGIN_EXAMPLE2: ICommandExampleDefinition = {
    description: "Log in to an API ML instance to obtain a token without storing it in a profile",
    options: "--show-token"
};

/**
  * Summary of APIML logout command
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGOUT_SUMMARY = "Log out of API ML authentication service";

/**
  * Description of APIML logout command
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGOUT_DESCRIPTION = "Log out of the Zowe API Mediation Layer authentication service and revoke the token so it " +
    "can no longer authenticate. Also remove the token from the default base profile, if it is stored on disk.";

/**
  * Example definition for APIML logout command
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGOUT_EXAMPLE1: ICommandExampleDefinition = {
    description: "Log out of an API ML instance to revoke the token that was in use and remove it from your base profile",
    options: ""
};

/**
  * Example definition for APIML logout command with token-value
  * @static
  * @memberof AuthConstants
  */
export const APIML_LOGOUT_EXAMPLE2: ICommandExampleDefinition = {
    description: "Log out of an API ML instance to revoke a token that was not stored in a profile",
    options: "--token-value <token>"
};

/**
  * Option used in APIML logout command for token-type
  */
export const APIML_LOGOUT_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
    ...BASE_OPTION_TOKEN_TYPE,
    allowableValues: { values: SessConstants.ALL_TOKEN_TYPES }
};