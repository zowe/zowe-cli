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

import { ICommandExampleDefinition } from "@zowe/imperative";

/**
 * Class to contain auth constants
 * @export
 * @class AuthConstants
 */
export class AuthConstants {

    /**
     * Description of APIML login command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_DESCRIPTION = "Login to API Mediation Layer and obtain or update a token value. " +
        "The token allows for a faster server-side request and cannot be transformed into native mainframe user credentials." +
        " Alternatively, you may provide \"user\" and \"password\" on a command, in an environmental variable, or in a profile." +
        " See a specific command's help via \"--help\" for more information.";

    /**
     * Example definition for APIML login command
     * @static
     * @memberof AuthConstants
     */
    public static readonly APIML_LOGIN_EXAMPLE: ICommandExampleDefinition = {
        description: "Login to an instance of API ML in order to obtain or update the " +
            "token value stored into your base profile",
        options: ""
    };
}
