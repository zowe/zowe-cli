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

import { IHandlerParameters, TextUtils } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
import { GetZosLog, IZosLogParms, IZosLogType, IZosLogItemType } from "@zowe/zos-logs-for-zowe-sdk";
/**
 * Handle to get logs from z/OSMF restful api
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class LogsHandler extends ZosmfBaseHandler {
    public async processCmd(commandParameters: IHandlerParameters) {
        const outputHeader = "Retrieved %s messages from %s, starts from %s, ends at %s. ";

        let startTime = new Date().toISOString();
        if (commandParameters.arguments.startTime !== undefined) {
            startTime = commandParameters.arguments.startTime;
            // in case the input is milliseconds format, which is a long number
            if (!isNaN(commandParameters.arguments.startTime)) {
                startTime = new Date(+startTime).toISOString();
            }
        }

        const zosLogParms: IZosLogParms = {
            startTime,
            direction: commandParameters.arguments.direction,
            range: commandParameters.arguments.range
        };

        try{
            const resp: IZosLogType = await GetZosLog.getZosLog(this.mSession, zosLogParms);

            const logItems: Array<IZosLogItemType> = resp.items;
            if (logItems === undefined || logItems.length === 0) {
                commandParameters.response.console.log(
                    TextUtils.formatMessage(outputHeader, 0, "logs", startTime, new Date(resp.nextTimestamp).toISOString())
                );
                return;
            }

            // remove control characters, except \u000A(\n) and \u000D(\r)
            for (const logItem of logItems) {
                logItem.message = logItem.message.
                    replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");  // eslint-disable-line no-control-regex
            }

            // Return as an object in the response 'data' field when using --response-format-json
            commandParameters.response.data.setObj(resp);

            commandParameters.response.console.log(
                TextUtils.formatMessage(outputHeader, resp.totalitems, resp.source, startTime, new Date(resp.nextTimestamp).toISOString())
            );
            commandParameters.response.console.log("");

            const memberList = logItems.map((logItem: any) =>
                new Date(logItem.timestamp).toISOString() + "  " + logItem.message.replace(/\r/g, "\n"));
            commandParameters.response.console.log(memberList.join("\n"));

        } catch (err) {
            if(err.mMessage !== undefined && err.mMessage.includes('status 404')){
                commandParameters.response.console.log("Note: This feature dependents on z/OSMF version 2.4 or higher. Ensure that the z/OSMF" +
                " Operations Log Support is available via APAR and associated PTFs: https://www.ibm.com/support/pages/apar/PH35930. \n");
            }
            throw err;
        }
    }
}
