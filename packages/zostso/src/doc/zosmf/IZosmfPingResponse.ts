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

import { IZosfmMessages } from "../../../";

/**
 * The z/OSMF Ping API parameters. See the z/OSMF REST API documentation for full details.
 * @export
 * @interface IZosmfPingResponse
 */

export interface IZosmfPingResponse {
    /**
     * Ping servlet key used text.
     * @type {string}
     * @memberof IZosmfPingResponse
     */
    "servletKey": string;

    /**
     * Ping version text.
     * @type {string}
     * @memberof IZosmfPingResponse
     */
    "ver": string;

    /**
     * Ping error message response.
     * @type {array}
     * @memberof IZosmfPingResponse
     */
    "msgData"?: IZosfmMessages[];

    /**
     * Ping reused boolean.
     * @type {boolean}
     * @memberof IZosmfPingResponse
     */
    "reused": boolean;

    /**
     * Ping timeout boolean.
     * @type {boolean}
     * @memberof IZosmfPingResponse
     */
    "timeout": boolean;
}
