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
import { SendTso, ISendResponse, ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";

/**
 * Handler to Send data to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {

    // Process the command - send data to the address space and produce the response
    public async processCmd(commandParameters: IHandlerParameters) {
        const response: ISendResponse = await SendTso.sendDataToTSOCollect(this.mSession,
            commandParameters.arguments.servletKey,
            commandParameters.arguments.data);

        // Print out the response
        commandParameters.response.console.log(response.commandResponse);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
