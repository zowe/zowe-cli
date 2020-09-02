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
import { CollectCommand, ICollectParms, IConsoleResponse } from "@zowe/zos-console-for-zowe-sdk";
import { ZosmfBaseHandler } from "../../../../src/provisioning/delete/instance/node_modules/@zowe/zosmf-for-zowe-sdk";

/**
 * Handle to collect a MVS console command response
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const collectParms: ICollectParms = {
            commandResponseKey: commandParameters.arguments.responsekey,
            consoleName: commandParameters.arguments["console-name"]
        };

        const response: IConsoleResponse = await CollectCommand.collect(this.mSession, collectParms);

        // Print out the response
        commandParameters.response.console.log(response.commandResponse);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);

    }
}
