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
 * Constants used for REST client, etc.
 * @export
 * @class RestConstants
 */
export class RestConstants {

    /**
     * 200
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_200 = 200;

    /**
     * 201
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_201 = 201;

    /**
     * 202
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_202 = 202; // accepted

    /**
     * 204
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_204 = 204;

    /**
     * 300
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_300 = 300;

    /**
     * 400
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_400 = 400;

    /**
     * 401
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_401 = 401;

    /**
     * 404
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_404 = 404;

    /**
     * 500
     * @static
     * @memberof RestConstants
     */
    public static readonly HTTP_STATUS_500 = 500;

    /**
     * Set cookie property
     * @static
     * @type {string}
     * @memberof RestConstants
     */
    public static readonly PROP_COOKIE: string = "set-cookie";

    /**
     * Query identifier
     * @static
     * @memberof RestConstants
     */
    public static readonly QUERY_ID = "?";

    /**
     * Basic auth
     * @static
     * @type {string}
     * @memberof RestConstants
     */
    public static readonly BASIC_PREFIX: string = "Basic ";

    /**
     * Bearer auth
     * @static
     * @type {string}
     * @memberof RestConstants
     */
    public static readonly BEARER_PREFIX: string = "Bearer ";
}
