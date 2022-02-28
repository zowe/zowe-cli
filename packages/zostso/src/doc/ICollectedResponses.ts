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

import { IZosmfTsoResponse } from "../doc/zosmf/IZosmfTsoResponse";

export interface ICollectedResponses {
    /**
     * z/OSMF synchronous most tso command response messages.
     * @type {IZosmfTsoResponse[]}
     * @memberof ICollectedResponses
     */
    tsos: IZosmfTsoResponse[];
    /**
     * Appended collected messages including READY prompt at the end.
     * @type {string}
     * @memberof ICollectedResponses
     */
    messages: string;
}
