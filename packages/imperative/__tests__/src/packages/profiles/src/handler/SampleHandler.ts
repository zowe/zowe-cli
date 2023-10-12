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

import { ICommandHandler, IHandlerParameters } from "../../../../../../src/cmd";
import { isNullOrUndefined } from "util";
import { ImperativeError } from "../../../../../../src/error";

export default class SampleHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters) {
        const profile: any = commandParameters.profiles.get("banana");
        if (isNullOrUndefined(profile)) {
            const errMsg = commandParameters.response.console.error("Failed to load a profile of type banana");
            throw new ImperativeError({msg: errMsg});
        }
    }
}
