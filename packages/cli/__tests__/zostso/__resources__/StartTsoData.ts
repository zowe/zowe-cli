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

import { IStartStopResponses } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Mocked data for start tso command.
 * @class StartTsoData
 */
export class StartTsoData {

    /**
     * Mocked data for starting address-space.
     * @static
     * @type {IStartStopResponses}
     * @memberof StartTsoData
     */
    public static readonly SAMPLE_START_RESPONSE: IStartStopResponses = {
        success: true,
        zosmfTsoResponse: {
            servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
            queueID: "4",
            ver: "0100",
            reused: false,
            timeout: false,
            sessionID: "0x37",
            tsoData: [{
                "TSO MESSAGE": {
                    VERSION: "0100",
                    DATA: "ZOSMFAD LOGON IN PROGRESS AT 01:12:04 ON JULY 17, 2017"
                }
            }]
        },
        collectedResponses: [],
        servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
        messages: "READY"
    };


    /**
     * Mocked data for start/issue commands
     * @static
     * @type {*}
     * @memberof StartTsoData
     */
    public static readonly SAMPLE_ISSUE_RESPONSE_WITH_MSG: any = {
        success: true,
        startResponse: {
            messages: "messages from TSO"
        },
        commandResponse: "this is the command response",
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
