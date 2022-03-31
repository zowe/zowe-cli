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


/**
 * Class for various logout constants.
 * @export
 * @class LogoutConstants
 */
export class LogoutConstants {


    /**
     * URI base jobs API
     * @static
     * @type {string}
     * @memberof LogoutConstants
     */
    public static readonly APIML_V1_RESOURCE: string = "/gateway/api/v1/auth/logout";

    /**
     * Zowe Token Expired Error Code
     * @static
     * @type {string}
     * @memberof LogoutConstants
     */
    public static readonly APIML_V1_TOKEN_EXP_ERR: string = "TokenExpireException";

}
