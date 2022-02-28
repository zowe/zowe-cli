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

import { ISendResponse } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Mocked data for send tso command.
 * @class SendTsoData
 */
export class SendTsoData {

    /**
     * Mocked data for send address-space.
     * @type {ISendResponse}
     * @memberof SendTsoData
     */
    public static readonly SAMPLE_SEND_RESPONSE: ISendResponse = {
        success: true,
        zosmfResponse: [
            {
                servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
                ver: "0100",
                reused: false,
                timeout: false
            }
        ],
        commandResponse: "READY"
    };
}
