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

import { IZosmfIssueResponse } from "./zosmf/IZosmfIssueResponse";
import { ImperativeError } from "@zowe/imperative";

/**
 * The Console API response.
 * @export
 * @interface IConsoleResponse
 */
export interface IConsoleResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof IConsoleResponse
     */
    success: boolean;

    /**
     * The list of zOSMF console API responses. May issue multiple requests (because of user request) or
     * to ensure that all messages are collected. Each individual response is placed here.
     * @type (IZosmfIssueResponse[]}
     * @memberof IConsoleResponse
     */
    zosmfResponse: IZosmfIssueResponse[];

    /**
     * If an error occurs, returns the ImperativeError, which contains casue error.
     * @type {ImperativeError}
     * @memberof IConsoleResponse
     */
    failureResponse?: ImperativeError;

    /**
     * The command response text.
     * @type{string}
     * @memberof IConsoleResponse
     */
    commandResponse: string;

    /**
     * The final command response key - used to "follow-up" and check for additional response messages for the command.
     * @type {string}
     * @memberof IConsoleResponse
     */
    lastResponseKey?: string;

    /**
     * If the solicited keyword is specified, indicates that the keyword was detected.
     * @type {boolean}
     * @memberof IConsoleResponse
     */
    keywordDetected?: boolean;

    /**
     * The "follow-up" command response URL - you can paste this in the browser to do a "GET" using the command
     * response key provided in the URI route.
     * @type {string}
     * @memberof IConsoleResponse
     */
    cmdResponseUrl?: string;
}
