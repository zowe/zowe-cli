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

import { IHandlerParameters, TextUtils } from "@zowe/core-for-zowe-sdk";
import { ICollectParms, IConsoleResponse, IIssueParms, IssueCommand } from "@zowe/zos-console-for-zowe-sdk";
import { isNullOrUndefined } from "util";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Handle to issue a MVS console command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        let response: IConsoleResponse;

        const issueParms: IIssueParms = {
            command: commandParameters.arguments.commandtext,
            consoleName: commandParameters.arguments["console-name"],
            solicitedKeyword: commandParameters.arguments["solicited-keyword"],
            sysplexSystem: commandParameters.arguments["sysplex-system"],
            async: commandParameters.arguments["key-only"] === true ? "Y" : "N"
        };

        if (isNullOrUndefined(commandParameters.arguments["wait-to-collect"])) {
            response = await IssueCommand.issue(this.mSession, issueParms);
        } else {
            const collectParms: ICollectParms = {
                commandResponseKey: "",
                consoleName: commandParameters.arguments["console-name"],
                waitToCollect: commandParameters.arguments["wait-to-collect"],
                followUpAttempts: commandParameters.arguments["follow-up-attempts"]
            };
            response = await IssueCommand.issueAndCollect(this.mSession, issueParms, collectParms);
        }

        // Print out the response
        if (commandParameters.arguments["key-only"]) {
            if (!isNullOrUndefined(response.lastResponseKey)) {
                commandParameters.response.console.log(response.lastResponseKey);
            }
        } else {
            commandParameters.response.console.log(response.commandResponse);
            if (commandParameters.arguments["include-details"]) {
                const details = {
                    responseKey: response.lastResponseKey,
                    cmdResponseUrl: response.cmdResponseUrl || undefined,
                    keywordDetected: response.keywordDetected ||
                        ((!isNullOrUndefined(commandParameters.arguments["solicited-keyword"])) ? false : undefined)
                };
                commandParameters.response.console.log("Additional details:");
                commandParameters.response.console.log("-------------------");
                commandParameters.response.console.log(TextUtils.prettyJson(details));
            }
        }

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
