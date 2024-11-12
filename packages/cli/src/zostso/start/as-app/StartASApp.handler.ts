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

import { IHandlerParameters, TextUtils } from "@zowe/imperative";
import { ZosTsoBaseHandler, AddressSpaceApps } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Handler to start app at an address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {
    // Process the command and produce the start response (returns servlet)
    public async processCmd(commandParameters: IHandlerParameters) {
        const response = await AddressSpaceApps.start(
            this.mSession,
            this.mArguments.account,
            {
                startupCommand: commandParameters.arguments.startup,
                appKey: commandParameters.arguments.appKey,
                servletKey: commandParameters.arguments.servletKey,
                queueID: commandParameters.arguments.queueId,
            },
            this.mTsoStart
        );
        commandParameters.response.console.log(TextUtils.chalk.yellow.bold("\n" + "Servlet Key: ") + response.servletKey);
        commandParameters.response.console.log(TextUtils.chalk.yellow.bold("Queue ID: ") + response.queueID + "\n");

        response.tsoData.forEach((data) => {
            commandParameters.response.console.log(typeof data === 'string' ? data : data?.DATA ?? "");
        });

        commandParameters.response.data.setObj(response);
    }
}
