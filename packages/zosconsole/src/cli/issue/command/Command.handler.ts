/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { ICollectParms, IConsoleResponse, IIssueParms, IssueCommand } from "../../../../../zosconsole";
import { isNullOrUndefined } from "util";

/**
 * Handle to issue a MVS console command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {

        let response: IConsoleResponse;
        const profile = commandParameters.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.pass,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });
        const issueParms: IIssueParms = {
            command: commandParameters.arguments.commandtext,
            consoleName: commandParameters.arguments["console-name"],
            solicitedKeyword: commandParameters.arguments["solicited-keyword"],
            sysplexSystem: commandParameters.arguments["sysplex-system"],
            async: commandParameters.arguments["key-only"] === true ? "Y" : "N",
        };

        if (isNullOrUndefined(commandParameters.arguments["wait-to-collect"])) {
            response = await IssueCommand.issue(session, issueParms);
        } else {
            const collectParms: ICollectParms = {
                commandResponseKey: "",
                consoleName: commandParameters.arguments["console-name"],
                waitToCollect: commandParameters.arguments["wait-to-collect"],
                followUpAttempts: commandParameters.arguments["follow-up-attempts"],
            };
            response = await IssueCommand.issueAndCollect(session, issueParms, collectParms);
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
                    ((!isNullOrUndefined(commandParameters.arguments["solicited-keyword"])) ? false : undefined),
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
