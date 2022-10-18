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

import { ProfileConstants } from "@zowe/core-for-zowe-sdk";

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
    public static readonly DESCRIPTION = `Welcome to ${Constants.DISPLAY_NAME}!

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

    //______________________________________________________________________
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_CONNECTION_OPTION_GROUP = ProfileConstants.BASE_CONNECTION_OPTION_GROUP;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_HOST = ProfileConstants.BASE_OPTION_HOST;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_PORT = ProfileConstants.BASE_OPTION_PORT;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_USER = ProfileConstants.BASE_OPTION_USER;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_PASSWORD = ProfileConstants.BASE_OPTION_PASSWORD;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_REJECT_UNAUTHORIZED = ProfileConstants.BASE_OPTION_REJECT_UNAUTHORIZED;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_TOKEN_TYPE = ProfileConstants.BASE_OPTION_TOKEN_TYPE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_TOKEN_VALUE = ProfileConstants.BASE_OPTION_TOKEN_VALUE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_CERT_FILE = ProfileConstants.BASE_OPTION_CERT_FILE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly BASE_OPTION_CERT_KEY_FILE = ProfileConstants.BASE_OPTION_CERT_KEY_FILE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    // public static readonly BASE_OPTION_CERT_FILE_PASSPHRASE = ProfileConstants.BASE_OPTION_CERT_FILE_PASSPHRASE

    //______________________________________________________________________
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_GROUP = ProfileConstants.AUTO_INIT_OPTION_GROUP;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_HOST = ProfileConstants.AUTO_INIT_OPTION_HOST;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_PORT = ProfileConstants.AUTO_INIT_OPTION_PORT;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_USER = ProfileConstants.AUTO_INIT_OPTION_USER;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_PASSWORD = ProfileConstants.AUTO_INIT_OPTION_PASSWORD;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_REJECT_UNAUTHORIZED = ProfileConstants.AUTO_INIT_OPTION_REJECT_UNAUTHORIZED;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_TOKEN_TYPE = ProfileConstants.AUTO_INIT_OPTION_TOKEN_TYPE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_TOKEN_VALUE = ProfileConstants.AUTO_INIT_OPTION_TOKEN_VALUE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTO_INIT_OPTION_CERT_FILE = ProfileConstants.AUTO_INIT_OPTION_CERT_FILE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
    */
    public static readonly AUTO_INIT_OPTION_CERT_KEY_FILE = ProfileConstants.AUTO_INIT_OPTION_CERT_KEY_FILE;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTH_GROUP_SUMMARY = ProfileConstants.AUTH_GROUP_SUMMARY;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly AUTH_GROUP_DESCRIPTION = ProfileConstants.AUTH_GROUP_DESCRIPTION;

    //______________________________________________________________________
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGIN_SUMMARY = ProfileConstants.APIML_LOGIN_SUMMARY;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGIN_DESCRIPTION = ProfileConstants.APIML_LOGIN_DESCRIPTION;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGIN_EXAMPLE1 = ProfileConstants.APIML_LOGIN_EXAMPLE1;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGIN_EXAMPLE2 = ProfileConstants.APIML_LOGIN_EXAMPLE2;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGOUT_SUMMARY = ProfileConstants.APIML_LOGOUT_SUMMARY;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGOUT_DESCRIPTION = ProfileConstants.APIML_LOGOUT_DESCRIPTION;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGOUT_EXAMPLE1 = ProfileConstants.APIML_LOGOUT_EXAMPLE1;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGOUT_EXAMPLE2 = ProfileConstants.APIML_LOGOUT_EXAMPLE2;
    /**
     * @deprecated Please use this constant from the @zowe/core-for-zowe-sdk
     */
    public static readonly APIML_LOGOUT_OPTION_TOKEN_TYPE = ProfileConstants.APIML_LOGOUT_OPTION_TOKEN_TYPE;
}
