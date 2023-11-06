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
    ICommandHandler, IHandlerParameters
} from "@zowe/core-for-zowe-sdk";

/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class RestartDaemonHandler implements ICommandHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     */
    public async process(cmdParams: IHandlerParameters): Promise<void> {
        await this.restartDaemon();
        cmdParams.response.console.log("Zowe daemon restart is only valid when daemon mode is enabled.");
        cmdParams.response.data.setExitCode(0);
    }

    /**
     * Restart daemon mode.
     *
     * @throws {ImperativeError}
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private async restartDaemon(): Promise<void> {
        /* dummy routine if called from the node.js version of Zowe. */
    }
}
