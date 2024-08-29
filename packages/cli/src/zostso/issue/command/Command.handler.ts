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

import { IHandlerParameters } from "@zowe/imperative";
import { IIssueResponse, IIssueTsoCmdResponse, IssueTso, ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Handler to issue command to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {

    // Process the command and produce the TSO response
    public async processCmd(params: IHandlerParameters) {

        // Issue the TSO command
        const response: IIssueResponse = await IssueTso.issueTsoCmd(this.mSession,params.arguments.commandText,params.arguments.stateful,params.arguments.ssm);
        // If requested, suppress the startup
        if (!params.arguments.suppressStartupMessages && response.startResponse != null) {
            this.console.log((response as any).startResponse.messages);
        }
        this.console.log((response as any).commandResponse);
        // Return as an object when using --response-format-json
        this.data.setObj(response);
    }
}
