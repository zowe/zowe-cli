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
 * Handler that prints out multiple error headers
 * @export
 * @class WithErrorHeadersHandler
 * @implements {ICommandHandler}
 */
export default class WithErrorHeadersHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        commandParameters.response.console.errorHeader("Error");
        commandParameters.response.console.error("An error has occurred.");
        commandParameters.response.console.errorHeader("Fatal Error", "!");
        commandParameters.response.console.error("A fatal error has occurred.");
    }
}
