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

import { IZosmfPingResponse } from "./zosmf/IZosmfPingResponse";
import { ImperativeError } from "@zowe/imperative";

export interface IPingResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof IPingResponse
     */
    success: boolean;

    /**
     * Response from z/OSMF to ping rest call
     * @type {IZosmfPingResponse}
     * @memberof IPingResponse
     */
    zosmfPingResponse: IZosmfPingResponse;

    /**
     * If an error occurs, returns the ImperativeError, which contains cause error.
     * @type {ImperativeError}
     * @memberof IConsoleResponse
     */
    failureResponse?: ImperativeError;

    /**
     * Servlet key from IZosmfPingResponse
     * @type {string}
     * @memberof IPingResponse
     */
    servletKey: string;

}
