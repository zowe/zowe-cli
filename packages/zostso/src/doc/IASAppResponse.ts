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

import { ITsoMessage } from "./zosmf/ITsoMessage";

export interface IASAppResponse {
    /**
     * Version in response
     * @type {boolean}
     * @memberof IASAppResponse
     */
    version: string
    /**
     * Data from response
     * @type {ITsoMessage[]}
     * @memberof IASAppResponse
     */
    tsoData: ITsoMessage[]
    /**
     * Reused boolean
     * @type {boolean}
     * @memberof IASAppResponse
     */
    reused: boolean
    /**
     * Timeout boolean response
     * @type {boolean}
     * @memberof IASAppResponse
     */
    timeout: boolean
    /**
     * Servlet key from IZosmfTsoResponse
     * @type {string}
     * @memberof IASAppResponse
     */
    servletKey?: string;
    /**
     * QueueID from created address space
     * @type {string}
     * @memberof IASAppResponse
     */
    queueID?: string;
}
