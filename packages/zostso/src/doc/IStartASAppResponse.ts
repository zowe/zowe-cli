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

import { ITsoMessage } from "../../lib";

export interface IStartASAppResponse {
    /**
     * Version in response
     * @type {boolean}
     * @memberof IStartASAppResponse
     */
    version: string
    /**
     * Data from response
     * @type {boolean}
     * @memberof IStartASAppResponse
     */
    tsoData: ITsoMessage[]
    /**
     * Reused boolean
     * @type {boolean}
     * @memberof IStartASAppResponse
     */
    reused: boolean
    /**
     * Data from response
     * @type {boolean}
     * @memberof IStartASAppResponse
     */
    timeout: boolean
    /**
     * Servlet key from IZosmfTsoResponse
     * @type {string}
     * @memberof IStartASAppResponse
     */
    servletKey?: string;
    /**
     * Servlet key from IZosmfTsoResponse
     * @type {string}
     * @memberof IStartASAppResponse
     */
    queueID?: string;
}
