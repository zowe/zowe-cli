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
import {
    IIssueResponse,
    IssueTso,
    ZosTsoBaseHandler,
} from "@zowe/zos-tso-for-zowe-sdk";
import chalk = require("chalk");
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
        const response: IIssueResponse = await IssueTso.issueTsoCmd(
            this.mSession,
            params.arguments.commandText,
            {
                isStateful: params.arguments.stateful,
                suppressStartupMessages:
                    params.arguments.suppressStartupMessages,
                addressSpaceOptions: this.mTsoStart
            }
        );
        const defProc = "IZUFPROC";
        if (params.arguments.logonProcedure && params.arguments.logonProcedure !== defProc && params.arguments.suppressStartupMessages) {
            this.console.error(
                chalk.yellow(
                    "Warning: The logon procedure specified is not used when issuing a TSO command with the suppressStartupMessages (--ssm) option set to true."
                )
            );
        }

        // If requested, suppress the startup
        if (
            !params.arguments.suppressStartupMessages &&
            response.startResponse != null
        ) {
            this.console.log(response.startResponse.messages);
        }
        if(response. zosmfResponse?.[0]?.servletKey)
            this.console.log(`${chalk.yellow("Servlet Key: ")}${response.zosmfResponse[0].servletKey}`);

        this.console.log(response.commandResponse);
        // Return as an object when using --response-format-json
        this.data.setObj(response);
    }
}
