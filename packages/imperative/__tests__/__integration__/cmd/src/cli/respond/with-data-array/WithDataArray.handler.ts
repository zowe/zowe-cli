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
 * Builds the response object with a message and an array.
 * @export
 * @class TestAsyncHandler
 * @implements {ICommandHandler}
 */
export default class WithDataArrayHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        commandParameters.response.data.setMessage(commandParameters.arguments.messageForResponse);
        commandParameters.response.data.setObj(commandParameters.arguments.stringsForArray);
        commandParameters.response.console.log("Array response built. Use --response-format-json to see the array.");
    }
}
