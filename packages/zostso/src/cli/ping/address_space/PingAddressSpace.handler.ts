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
import { IPingResponse, PingTso } from "../../../../../zostso";
import { ZosTsoBaseHandler } from "../../../ZosTsoBaseHandler";

/**
 * Handler to Send data to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {

    // Process the command and produce the ping response
    public async processCmd(commandParameters: IHandlerParameters) {
        // Ping the address space
        const response: IPingResponse = await PingTso.ping(this.mSession, commandParameters.arguments.servletKey);

        // Print out the response
        commandParameters.response.console.log("TSO address space pinged successfully, key was: " + response.servletKey);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
