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

import { ICommandHandler } from "../../src/doc/handler/ICommandHandler";
import { IHandlerParameters } from "../../src/doc/handler/IHandlerParameters";
import { ImperativeError } from "../../../error";

export default class TestCmdHandler implements ICommandHandler {
    public process(commandParameters: IHandlerParameters): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (commandParameters.arguments.throwErrorWithTab) {
                throw new ImperativeError({
                    msg: `\tTab!\tTab again!\nLine should not be indented`,
                    additionalDetails: "More details!"
                });
            }
            if (commandParameters.arguments.throwImperative) {
                throw new ImperativeError({
                    msg: `Handler threw an imperative error!`,
                    causeErrors: '{"jsonCause": "causeErrors are a JSON object"}',
                    additionalDetails: "More details!"
                });
            }
            if (commandParameters.arguments.throwImpStringCause) {
                throw new ImperativeError({
                    msg: `Handler threw an imperative error!`,
                    causeErrors: "causeErrors are just contained in a string",
                    additionalDetails: "More details!"
                });
            }
            if (commandParameters.arguments.throwError) {
                if ( commandParameters.arguments.this.doesnt.exist) {
                    resolve();
                }
            }

            if (commandParameters.arguments.rejectWithMessage) {
                reject("Rejected with a message");
            } else if (commandParameters.arguments.rejectWithNothing) {
                reject();
            } else if (commandParameters.arguments.throwObject) {
                throw {
                    weird: "error"
                };
            } else {
                resolve();
            }
        });
    }
}
