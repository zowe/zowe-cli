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

import { ICommandHandler, IHandlerParameters } from "../../../../../../../lib/index";
/**
 * Handler that prints out multiple log messages
 * @export
 * @class WithLogMessagesHandler
 * @implements {ICommandHandler}
 */
export default class WithLogMessagesHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        commandParameters.response.console.log("Format String: " + commandParameters.arguments.formatString);
        commandParameters.response.console.log("Values Array: " + commandParameters.arguments.formatValues);
        commandParameters.response.console.log("Formatted:");
        commandParameters.response.console.log(commandParameters.arguments.formatString,
            ...commandParameters.arguments.formatValues);
        commandParameters.response.console.log(Buffer.from("these"));
        commandParameters.response.console.log(Buffer.from("messages"));
        commandParameters.response.console.log(Buffer.from("should"));
        commandParameters.response.console.log(Buffer.from("display"));
        commandParameters.response.console.log(Buffer.from("on"));
        commandParameters.response.console.log(Buffer.from("the"));
        commandParameters.response.console.log(Buffer.from("same"));
        commandParameters.response.console.log(Buffer.from("line"));
        commandParameters.response.console.log(Buffer.from("with"));
        commandParameters.response.console.log(Buffer.from("no"));
        commandParameters.response.console.log(Buffer.from("spaces"));
    }
}
