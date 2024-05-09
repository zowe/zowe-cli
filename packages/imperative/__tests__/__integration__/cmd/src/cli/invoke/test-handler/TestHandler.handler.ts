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

import { ICommandHandler, IHandlerParameters, ImperativeError } from "../../../../../../../lib/index";
/**
 * Handler that returns a promise.
 * @export
 * @class TestHandler
 * @implements {ICommandHandler}
 */
export default class TestHandler implements ICommandHandler {
    public process(commandParameters: IHandlerParameters): Promise<void> {
        return new Promise<void>((fulfill, reject) => {

            // Fail the handler by invoking the reject method without anything
            if (commandParameters.arguments.fail) {
                reject();
            } else {

                // Reject with a message
                if (commandParameters.arguments.failWithMessage) {
                    reject(commandParameters.arguments.failWithMessage);
                } else {

                    // Throw a generic error
                    if (commandParameters.arguments.failWithError) {
                        throw new Error("Fail with Error");
                    }

                    // Throw an imperative error
                    if (commandParameters.arguments.failWithImperativeError) {
                        throw new ImperativeError({ msg: "Fail with Imperative Error" });
                    }

                    // Fulfill the promise
                    if (commandParameters.arguments.fulfillPromise) {
                        commandParameters.response.console.log("Fulfilling the promise...");
                        fulfill();
                    } else {
                        // Essentially do nothing
                        commandParameters.response.console.log("No options specified, will not invoke anything!");
                    }
                }
            }
        });
    }
}
