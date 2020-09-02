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

import { IZosmfTsoResponse } from "../../";

/**
 * The TsoSend API response.
 * @export
 * @interface ISendResponse
 */
export interface ISendResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof ISendResponse
     */
    success: boolean;

    /**
     * The list of zOSMF send API responses. May issue multiple requests or
     * to ensure that all messages are collected. Each individual response is placed here.
     * @type (IZosmfTsoResponse[]}
     * @memberof ISendResponse
     */
    zosmfResponse: IZosmfTsoResponse[];

    /**
     * The command response text.
     * @type{string}
     * @memberof ISendResponse
     */
    commandResponse: string;

}
