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

import { IPingResponse } from "../../../zostso";

/**
 * Mocked data for ping tso command.
 * @class PingTsoData
 */
export class PingTsoData {

    /**
     * Mocked data for ping address-space.
     * @type {IPingResponse}
     * @memberOf PingTsoData
     */
    public static readonly SAMPLE_PING_RESPONSE: IPingResponse = {
        success: true,
        zosmfPingResponse:
            {
                servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
                ver: "0100",
                reused: false,
                timeout: false
            },
        servletKey: "ZOSMFAD-SYS2-55-aaakaaac"
    };
}
