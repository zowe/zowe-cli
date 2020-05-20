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
    IHandlerParameters,
    Imperative,
    SessConstants,
    ICommandHandler
} from "@zowe/imperative";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Handler to login to z/OSMF
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class ApimlHandler implements ICommandHandler {
    /**
     * Handler for the "auth logout apiml" command.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     */
    public async process(params: IHandlerParameters): Promise<void> {
        /* Do nothing */
    }
}
