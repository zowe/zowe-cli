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

import { IHandlerParameters } from "npm:@zowe/imperative";
import { ZosTsoBaseHandler, AddressSpaceApps } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Handler to send a message to address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {
    // Process the command and transmit a message to an app running at a TSO address space
    public async processCmd(commandParameters: IHandlerParameters) {

        commandParameters.response.progress.startSpinner("Sending request...");

        const response = await AddressSpaceApps.send(
            this.mSession,
            this.mArguments.account,
            {
                appKey: commandParameters.arguments.appKey,
                servletKey: commandParameters.arguments.servletKey,
                message: commandParameters.arguments.message,
            },
            this.mTsoStart
        );

        commandParameters.response.progress.endSpinner();

        commandParameters.response.console.log("\n");
        response.tsoData.forEach((data) => {
            commandParameters.response.console.log(typeof data === 'string' ? data : data?.DATA ?? "");
        });
        commandParameters.response.data.setObj(response);
    }
}
