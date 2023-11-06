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

import { IZosmfTsoResponse } from "./zosmf/IZosmfTsoResponse";
import { ImperativeError } from "@zowe/core-for-zowe-sdk";

export interface IStartStopResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof IStartStopResponse
     */
    success: boolean;

    /**
     * Response from z/OSMF to start rest call
     * @type {IZosmfTsoResponse}
     * @memberof IStartStopResponse
     */
    zosmfTsoResponse: IZosmfTsoResponse;

    /**
     * If an error occurs, returns the ImperativeError, which contains cause error.
     * @type {ImperativeError}
     * @memberof IStartStopResponse
     */
    failureResponse?: ImperativeError;

    /**
     * Servlet key from IZosmfTsoResponse
     * @type {string}
     * @memberof IStartStopResponse
     */
    servletKey: string;

}
