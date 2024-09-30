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

export interface IStartASAppResponse {
    /**
     * True if the command was issued and the responses were collected.
     * @type {boolean}
     * @memberof IStartASAppResponse
     */
    success: boolean;
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
