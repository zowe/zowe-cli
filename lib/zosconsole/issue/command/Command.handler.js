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
const zos_console_for_zowe_sdk_1 = require("@zowe/zos-console-for-zowe-sdk");
const util_1 = require("util");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Handle to issue a MVS console command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class Handler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            const issueParms = {
                command: commandParameters.arguments.commandtext,
                consoleName: commandParameters.arguments["console-name"],
                solicitedKeyword: commandParameters.arguments["solicited-keyword"],
                sysplexSystem: commandParameters.arguments["sysplex-system"],
                async: commandParameters.arguments["key-only"] === true ? "Y" : "N"
            };
            if ((0, util_1.isNullOrUndefined)(commandParameters.arguments["wait-to-collect"])) {
                response = yield zos_console_for_zowe_sdk_1.IssueCommand.issue(this.mSession, issueParms);
            }
            else {
                const collectParms = {
                    commandResponseKey: "",
                    consoleName: commandParameters.arguments["console-name"],
                    waitToCollect: commandParameters.arguments["wait-to-collect"],
                    followUpAttempts: commandParameters.arguments["follow-up-attempts"]
                };
                response = yield zos_console_for_zowe_sdk_1.IssueCommand.issueAndCollect(this.mSession, issueParms, collectParms);
            }
            // Print out the response
            if (commandParameters.arguments["key-only"]) {
                if (!(0, util_1.isNullOrUndefined)(response.lastResponseKey)) {
                    commandParameters.response.console.log(response.lastResponseKey);
                }
            }
            else {
                commandParameters.response.console.log(response.commandResponse);
                if (commandParameters.arguments["include-details"]) {
                    const details = {
                        responseKey: response.lastResponseKey,
                        cmdResponseUrl: response.cmdResponseUrl || undefined,
                        keywordDetected: response.keywordDetected ||
                            ((!(0, util_1.isNullOrUndefined)(commandParameters.arguments["solicited-keyword"])) ? false : undefined)
                    };
                    commandParameters.response.console.log("Additional details:");
                    commandParameters.response.console.log("-------------------");
                    commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(details));
                }
            }
            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=Command.handler.js.map