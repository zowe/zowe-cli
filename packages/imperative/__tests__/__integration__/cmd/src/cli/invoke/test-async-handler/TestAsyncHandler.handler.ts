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

import {
    ICommandHandler,
    IHandlerParameters,
    ImperativeError
} from "../../../../../../../lib/index";
/**
 * A test handler with async.
 * @export
 * @class TestAsyncHandler
 * @implements {ICommandHandler}
 */
export default class TestAsyncHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        // Fail the command with an imperative error
        if (commandParameters.arguments.fail) {
            throw new ImperativeError({ msg: "Fail with Imperative Error" });
        }

        // Fail the command with a generic "Error"
        if (commandParameters.arguments.failWithError) {
            throw new Error("Fail with Error");
        }

        // No options specified
        commandParameters.response.console.log("No options specified!");
    }
}
