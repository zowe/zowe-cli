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
export default class LoggingHandler implements ICommandHandler {
    public static readonly SUCCESS_MESSAGE = "Validation passed";
    public async process(params: IHandlerParameters) {
        params.response.console.log("Test Log Command!");

        // Issue various log messages to the imperative logger
        Imperative.api.imperativeLogger.trace("This is an imperative logger trace message from the test logging handler!");
        Imperative.api.imperativeLogger.debug("This is an imperative logger debug message from the test logging handler!");
        Imperative.api.imperativeLogger.info("This is an imperative logger info message from the test logging handler!");
        Imperative.api.imperativeLogger.warn("This is an imperative logger warn message from the test logging handler!");
        Imperative.api.imperativeLogger.error("This is an imperative logger error message from the test logging handler!");
        Imperative.api.imperativeLogger.fatal("This is an imperative logger fatal message from the test logging handler!");

        // Issue various log messages to the app logger
        Imperative.api.appLogger.trace("This is an app logger trace message from the test logging handler!");
        Imperative.api.appLogger.debug("This is an app logger debug message from the test logging handler!");
        Imperative.api.appLogger.info("This is an app logger info message from the test logging handler!");
        Imperative.api.appLogger.warn("This is an app logger warn message from the test logging handler!");
        Imperative.api.appLogger.error("This is an app logger error message from the test logging handler!");
        Imperative.api.appLogger.fatal("This is an app logger fatal message from the test logging handler!");
    }
}
