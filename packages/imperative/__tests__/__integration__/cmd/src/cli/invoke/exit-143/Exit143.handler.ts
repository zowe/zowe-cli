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
    public async process(commandParameters: IHandlerParameters) {
        const ONE_FOUR_THREE = 143;
        commandParameters.response.data.setExitCode(ONE_FOUR_THREE);
        throw new ImperativeError({msg: "Command failed with exit code " + ONE_FOUR_THREE});
    }
}
