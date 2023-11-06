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
 * Handler that prints out multiple error messages
 * @export
 * @class WithErrorMessagesHandler
 * @implements {ICommandHandler}
 */
export default class WithErrorMessagesHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        commandParameters.response.console.error("Format String: " + commandParameters.arguments.formatString);
        commandParameters.response.console.error("Values Array: " + commandParameters.arguments.formatValues);
        commandParameters.response.console.error("Formatted:");
        commandParameters.response.console.error(commandParameters.arguments.formatString,
            ...commandParameters.arguments.formatValues);
        commandParameters.response.console.error(Buffer.from("these"));
        commandParameters.response.console.error(Buffer.from("messages"));
        commandParameters.response.console.error(Buffer.from("should"));
        commandParameters.response.console.error(Buffer.from("display"));
        commandParameters.response.console.error(Buffer.from("on"));
        commandParameters.response.console.error(Buffer.from("the"));
        commandParameters.response.console.error(Buffer.from("same"));
        commandParameters.response.console.error(Buffer.from("line"));
        commandParameters.response.console.error(Buffer.from("with"));
        commandParameters.response.console.error(Buffer.from("no"));
        commandParameters.response.console.error(Buffer.from("spaces"));
    }
}
