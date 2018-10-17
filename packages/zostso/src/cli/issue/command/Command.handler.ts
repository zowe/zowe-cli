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

import { ICommandHandler, IHandlerParameters, Session, IProfile } from "@brightside/imperative";
import { IIssueResponse, ISendResponse, IssueTso, SendTso } from "../../../../../zostso";
import { IStartTsoParms } from "../../../../index";
import { ZosmfSession } from "../../../../../zosmf";

/**
 * Handler to issue command to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {
        const session = ZosmfSession.createBasicZosmfSessionFromArguments(commandParameters.arguments);
        // TODO: need to replace the arguments with the correct mapping object
        const response: IIssueResponse = await IssueTso.issueTsoCommand(session, commandParameters.arguments.account,
            commandParameters.arguments.commandText,
            commandParameters.arguments as any);

        if (!commandParameters.arguments.suppressStartupMessages) {
            commandParameters.response.console.log(response.startResponse.messages);
        }
        commandParameters.response.console.log(response.commandResponse);
        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
