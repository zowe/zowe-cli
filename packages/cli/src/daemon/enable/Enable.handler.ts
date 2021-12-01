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
 * Handler to enable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class EnableDaemonHandler implements ICommandHandler {
    /**
     * Process the enable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public process(cmdParams: IHandlerParameters): Promise<void> {
        if ( this.enableDaemon() ) {
            cmdParams.response.console.log("Daemon mode enabled");
        } else {
            cmdParams.response.console.log("Failed to enable daemon mode");
        }
        return;
    }

    /**
     * Enable daemon mode.
     *
     * @returns True upon success. False otherwise.
     */
    private enableDaemon(): boolean {
        return true;
    }
}
