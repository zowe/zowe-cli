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

import { IHandlerParameters, ImperativeError } from "@brightside/imperative";
import { StartTso } from "../../../../../zostso";
import { ZosTsoBaseHandler } from "../../../ZosTsoBaseHandler";

/**
 * Handler to start an address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {

    // Process the command and produce the start response (returns servlet)
    public async processCmd(commandParameters: IHandlerParameters) {
        const response = await StartTso.start(this.mSession, this.mArguments.account, this.mTsoStart);
        commandParameters.response.data.setObj(response);

        if (response.success) {
            if (commandParameters.arguments.servletKeyOnly) {
                commandParameters.response.console.log(response.servletKey);
            } else {
                commandParameters.response.console.log(`TSO address space began successfully, key is: ${response.servletKey}\n`);
                commandParameters.response.console.log(response.messages);
            }

        } else {
            throw new ImperativeError({
                msg: `TSO address space failed to start.`,
                additionalDetails: response.failureResponse.message
            });
        }
    }
}
