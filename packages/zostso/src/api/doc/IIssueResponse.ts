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

import { IStartStopResponse, IZosmfTsoResponse } from "../../../../zostso";
import { IStartStopResponses } from "./IStartStopResponses";

/**
 * The TsoSend API response.
 * @export
 * @interface ISendResponse
 */
export interface IIssueResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof IIssueResponse
     */
    success: boolean;

    /**
     * zOSMF start TSO API response.
     * @type (IStartStopResponse}
     * @memberof ISendResponse
     */
    startResponse: IStartStopResponses;

    /**
     * Indicates if started TSO containes "READY " message
     * @type (boolean}
     * @memberof IIssueResponse
     */
    startReady: boolean;

    /**
     * zOSMF stop TSO API response.
     * @type (IStartStopResponse}
     * @memberof IIssueResponse
     */
    stopResponse: IStartStopResponse;
    /**
     * The list of zOSMF send API responses. May issue multiple requests or
     * to ensure that all messages are collected. Each individual response is placed here.
     * @type (IZosmfTsoResponse[]}
     * @memberof IIssueResponse
     */
    zosmfResponse: IZosmfTsoResponse[];

    /**
     * The command response text.
     * @type{string}
     * @memberof IIssueResponse
     */
    commandResponse: string;

}
