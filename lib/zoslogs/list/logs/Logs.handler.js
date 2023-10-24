"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
const zos_logs_for_zowe_sdk_1 = require("@zowe/zos-logs-for-zowe-sdk");
/**
 * Handle to get logs from z/OSMF restful api
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class LogsHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputHeader = "Retrieved %s messages from %s, starts from %s, ends at %s. ";
            let startTime = new Date().toISOString();
            if (commandParameters.arguments.startTime !== undefined) {
                startTime = commandParameters.arguments.startTime;
                // in case the input is milliseconds format, which is a long number
                if (!isNaN(commandParameters.arguments.startTime)) {
                    startTime = new Date(+startTime).toISOString();
                }
            }
            const zosLogParms = {
                startTime,
                direction: commandParameters.arguments.direction,
                range: commandParameters.arguments.range
            };
            try {
                const resp = yield zos_logs_for_zowe_sdk_1.GetZosLog.getZosLog(this.mSession, zosLogParms);
                const logItems = resp.items;
                if (logItems === undefined || logItems.length === 0) {
                    commandParameters.response.console.log(imperative_1.TextUtils.formatMessage(outputHeader, 0, "logs", startTime, new Date(resp.nextTimestamp).toISOString()));
                    return;
                }
                // remove control characters, except \u000A(\n) and \u000D(\r)
                for (const logItem of logItems) {
                    logItem.message = logItem.message.
                        replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ""); // eslint-disable-line no-control-regex
                }
                // Return as an object in the response 'data' field when using --response-format-json
                commandParameters.response.data.setObj(resp);
                commandParameters.response.console.log(imperative_1.TextUtils.formatMessage(outputHeader, resp.totalitems, resp.source, startTime, new Date(resp.nextTimestamp).toISOString()));
                commandParameters.response.console.log("");
                const memberList = logItems.map((logItem) => new Date(logItem.timestamp).toISOString() + "  " + logItem.message.replace(/\r/g, "\n"));
                commandParameters.response.console.log(memberList.join("\n"));
            }
            catch (err) {
                if (err.mMessage !== undefined && err.mMessage.includes('status 404')) {
                    commandParameters.response.console.log("Note: This feature dependents on z/OSMF version 2.4 or higher. Ensure that the z/OSMF" +
                        " Operations Log Support is available via APAR and associated PTFs: https://www.ibm.com/support/pages/apar/PH35930. \n");
                }
                throw err;
            }
        });
    }
}
exports.default = LogsHandler;
//# sourceMappingURL=Logs.handler.js.map