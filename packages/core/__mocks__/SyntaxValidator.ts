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

import { Arguments } from "yargs";

import { CommandResponse } from "../src/cmd/response/CommandResponse";
import { ICommandValidatorResponse } from "../src/cmd/doc/response/response/ICommandValidatorResponse";

export class SyntaxValidator {
    public validate(responseObject: CommandResponse, commandArguments: Arguments): Promise<ICommandValidatorResponse> {
        return new Promise<ICommandValidatorResponse>((validationComplete) => {
            if (commandArguments.syntaxThrow === true) {
                throw new Error("Syntax validation error!");
            } else {
                validationComplete({ valid: (commandArguments.valid == null) ? false : commandArguments.valid as boolean });
            }
        });
    }
}
