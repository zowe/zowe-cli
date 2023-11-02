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

import { IImperativeError } from "../../error/doc/IImperativeError";
import { ICommandHandler } from "../doc/handler/ICommandHandler";
import { IHandlerParameters } from "../doc/handler/IHandlerParameters";
import { ImperativeError } from "../../error/ImperativeError";

/**
 * Handler used to respond to unexpected errors
 */
export default class FailedCommandHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        if (params.arguments.error && params.arguments.failureMessage.indexOf("syntax") === -1) {
            // don't print the stack if it's just a syntax error
            params.response.console.error(params.arguments.error.stack);
        }
        const additionalDetails: string = params.arguments.error ? params.arguments.error.message : undefined;
        const msg: string = (additionalDetails == null) ? params.arguments.failureMessage : additionalDetails + "\n"
            + params.arguments.failureMessage;
        const failedCommandError: IImperativeError = {
            msg,
            causeErrors: params.arguments.error ? params.arguments.error : undefined,
            additionalDetails
        };
        params.response.data.setMessage(params.arguments.failureMessage + ": " + failedCommandError.additionalDetails);
        throw new ImperativeError(failedCommandError);
    }
}
