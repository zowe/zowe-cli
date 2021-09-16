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

import { IZosLogType } from "@zowe/zos-logs-for-zowe-sdk";
export class GetLogsData {
    public static readonly SAMPLE_RESP_DATA: IZosLogType = {
        timezone: -4,
        nextTimestamp: 1628576194965,
        source: "OPERLOG",
        totalitems: 2,
        items: [
            {
                jobName: "TCP342  ",
                system: "P00     ",
                color: "green",
                replyId: "0",
                messageId: "90679641840",
                subType: "NULL",
                time: "Tue Aug 10 06:16:35 GMT 2021",
                message:
                    " EZD1287I TTLS Error RC: 5004 Initial Handshake\r   LOCAL: ::FFFF:000.000.000.002..3973\r   REMOTE: ::FFFF:000.000.000.003..8803\r   JOBNAME: P00SVR00 RULE: DDSClientRule\r   USERID: IZUSVR0 GRPID: 00000003 ENVID: 00000001 CONNID: 0001EEF1",
                type: "HARDCOPY",
                cart: "0",
                timestamp: 1628576195960
            },
            {
                jobName: "TCP342  ",
                system: "P00     ",
                color: "green",
                replyId: "0",
                messageId: "90679642096",
                subType: "NULL",
                time: "Tue Aug 10 06:16:35 GMT 2021",
                message:
                    " EZD1287I TTLS Error RC:  406 Initial Handshake\r   LOCAL: ::FFFF:000.000.000.002..3973\r   REMOTE: ::FFFF:000.000.000.003..8803\r   JOBNAME: P00SVR00 RULE: DDSClientRule\r   USERID: IZUSVR0 GRPID: 00000003 ENVID: 00000001 CONNID: 0001EEF1",
                type: "HARDCOPY",
                cart: "0",
                timestamp: 1628576195960
            }
        ]
    };
    public static readonly SAMPLE_RESP_DATA_EMPTY: IZosLogType = {
        timezone: -4,
        nextTimestamp: 1629086762008,
        source: "OPERLOG",
        totalitems: 0,
        items: []
    };
}
