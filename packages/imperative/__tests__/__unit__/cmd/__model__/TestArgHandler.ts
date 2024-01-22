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

import { ICommandHandler } from "../../../../src/cmd/doc/handler/ICommandHandler";
import { IHandlerParameters } from "../../../../src/cmd/doc/handler/IHandlerParameters";

export default class TestCmdHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters) {
        commandParameters.response.console.log(commandParameters.arguments.color);
    }
}
