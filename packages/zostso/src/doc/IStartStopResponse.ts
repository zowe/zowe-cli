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
import { ImperativeError } from "@zowe/imperative";

export interface IStartStopResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberOf IStartStopResponse
     */
    success: boolean;

    /**
     * Response from z/OSMF to start rest call
     * @type (IZosmfTsoResponse}
     * @memberOf IStartStopResponse
     */
    zosmfTsoResponse: IZosmfTsoResponse;

    /**
     * If an error occurs, returns the ImperativeError, which contains cause error.
     * @type {ImperativeError}
     * @memberOf IStartStopResponse
     */
    failureResponse?: ImperativeError;

    /**
     * Servlet key from IZosmfTsoResponse
     * @type (string}
     * @memberOf IStartStopResponse
     */
    servletKey: string;

}
