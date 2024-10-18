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
import { ZosTsoBaseHandler, ReceiveTsoApp } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Handler to receive message from an app at an address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {
    // Process the command and produce the start response (returns servlet)
    public async processCmd(commandParameters: IHandlerParameters) {
        const response = await ReceiveTsoApp.receive(
            this.mSession,
            this.mArguments.account,
            {
                appKey: commandParameters.arguments.appKey,
                servletKey: commandParameters.arguments.servletKey,
                receiveUntilReady: commandParameters.arguments.receiveUntilReady,
                timeout: commandParameters.arguments.timeout
            },
        );
        commandParameters.response.console.log("\n");
        response.tsoData.forEach((data) => {
            if(typeof data === 'string') {
                commandParameters.response.console.log(data);
            } else if (data && data.DATA) {
                commandParameters.response.console.log(data.DATA);
            }
        });
        commandParameters.response.data.setObj(response);
    }
}
