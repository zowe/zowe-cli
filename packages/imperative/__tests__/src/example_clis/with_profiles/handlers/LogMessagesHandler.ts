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

import { ICommandHandler, IHandlerParameters } from "../../../../../src/cmd";
import { Imperative } from "../../../../../src/imperative";


export default class ProduceLogMessagesHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        Imperative.api.appLogger.level = params.arguments.level;
        Imperative.api.appLogger.trace("This is a trace message");
        Imperative.api.appLogger.debug("This is a debug message");
        Imperative.api.appLogger.info("This is an info message");
        Imperative.api.appLogger.warn("This is a warn message");
        Imperative.api.appLogger.error("This is an error message");
        Imperative.api.appLogger.fatal("This is a fatal message");
        params.response.console.log("Log messages were written");
    }
}
