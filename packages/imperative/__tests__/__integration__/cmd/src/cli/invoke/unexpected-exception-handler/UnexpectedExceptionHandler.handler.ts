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
 * The unexpected exception handler attempts to perform an operation that results in an unexpected exception.
 * @export
 * @class UnexpectedExceptionHandler
 * @implements {ICommandHandler}
 */
export default class UnexpectedExceptionHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        commandParameters.arguments.thisArgumentDoesntExist.split(" ").join("\n");
    }
}
