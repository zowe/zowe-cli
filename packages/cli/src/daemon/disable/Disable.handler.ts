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

import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";

/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class DisableDaemonHandler implements ICommandHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public process(cmdParams: IHandlerParameters): Promise<void> {
        if ( this.disableDaemon() ) {
            cmdParams.response.console.log("Daemon mode disabled");
        } else {
            cmdParams.response.console.log("Failed to disable daemon mode");
        }
        return;
    }

    /**
     * Enable daemon mode.
     *
     * @returns True upon success. False otherwise.
     */
    private disableDaemon(): boolean {
        return true;
    }
}
