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

import { IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import { StopTso, ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";

export default class Handler extends ZosTsoBaseHandler {

    // Stop the tso address space associated with the servlet key
    public async processCmd(commandParameters: IHandlerParameters) {

        // Stop the address space
        const servletKey = commandParameters.arguments.servletkey;
        const response = await StopTso.stop(this.mSession, servletKey);

        // Print response and return as an object when using --response-format-json
        commandParameters.response.console.log(`TSO address space ended successfully, key was: ${response.servletKey}`);
        commandParameters.response.data.setObj(response);
    }
}
