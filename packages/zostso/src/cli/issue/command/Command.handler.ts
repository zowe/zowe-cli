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

import { ICommandHandler, IHandlerParameters, Session } from "@brightside/imperative";
import { IIssueResponse, ISendResponse, IssueTso, SendTso } from "../../../../../zostso";
import { IStartTsoParms } from "../../../../index";

/**
 * Handler to issue command to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {
        const profile = commandParameters.profiles.get("zosmf");
        const tsoProfile: IStartTsoParms = commandParameters.profiles.get("tso") as IStartTsoParms;
        const session = new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.pass,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });
        const response: IIssueResponse = await IssueTso.issueTsoCommand(session, tsoProfile.account,
            commandParameters.arguments.commandText,
            tsoProfile);

        if (!commandParameters.arguments.suppressStartupMessages) {
            commandParameters.response.console.log(response.startResponse.messages);
        }
        commandParameters.response.console.log(response.commandResponse);
        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
