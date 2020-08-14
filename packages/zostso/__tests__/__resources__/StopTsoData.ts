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

import { IStartStopResponse } from "../../../zostso";

/**
 * Mocked data for stop tso command.
 * @class StopTsoData
 */
export class StopTsoData {

    /**
     * Mocked data for stop address-space.
     * @type {IStartStopResponse}
     * @memberOf StopTsoData
     */
    public static readonly SAMPLE_STOP_RESPONSE: IStartStopResponse = {
        success: true,
        zosmfTsoResponse:
            {
                servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
                queueID: "4",
                ver: "0100",
                reused: false,
                timeout: false
            },
        servletKey: "ZOSMFAD-SYS2-55-aaakaaac"
    };
}
