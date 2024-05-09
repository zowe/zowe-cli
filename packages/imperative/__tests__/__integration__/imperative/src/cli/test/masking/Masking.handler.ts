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

import { IHandlerParameters, ICommandHandler, Imperative } from "../../../../../../../lib/index";
/**
 * Syntax test handler. Invoked if the syntax for the command is correct.
 * @export
 * @class ValidationTestCommand
 * @implements {ICommandHandler}
 */
export default class MaskingHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        // Issue various log messages to the console logger
        params.response.console.log("Test-Masking: console logger: log message: " + params.arguments.testArgument);
        params.response.console.error("Test-Masking: console logger: error message: " + params.arguments.testArgument);
        params.response.console.errorHeader("Test-Masking: console logger: errorHeader message: " + params.arguments.testArgument);
        params.response.console.prompt("Test-Masking: console logger: prompt message: " + params.arguments.testArgument);

        // Issue various log messages to the imperative logger
        Imperative.api.imperativeLogger.trace("Test-Masking: imperative logger: trace message: " + params.arguments.testArgument);
        Imperative.api.imperativeLogger.debug("Test-Masking: imperative logger: debug message: " + params.arguments.testArgument);
        Imperative.api.imperativeLogger.info("Test-Masking: imperative logger: info message: " + params.arguments.testArgument);
        Imperative.api.imperativeLogger.warn("Test-Masking: imperative logger: warn message: " + params.arguments.testArgument);
        Imperative.api.imperativeLogger.error("Test-Masking: imperative logger: error message: " + params.arguments.testArgument);
        Imperative.api.imperativeLogger.fatal("Test-Masking: imperative logger: fatal message: " + params.arguments.testArgument);

        // Issue various log messages to the app logger
        Imperative.api.appLogger.trace("Test-Masking: app logger: trace message: " + params.arguments.testArgument);
        Imperative.api.appLogger.debug("Test-Masking: app logger: debug message: " + params.arguments.testArgument);
        Imperative.api.appLogger.info("Test-Masking: app logger: info message: " + params.arguments.testArgument);
        Imperative.api.appLogger.warn("Test-Masking: app logger: warn message: " + params.arguments.testArgument);
        Imperative.api.appLogger.error("Test-Masking: app logger: error message: " + params.arguments.testArgument);
        Imperative.api.appLogger.fatal("Test-Masking: app logger: fatal message: " + params.arguments.testArgument);
    }
}
