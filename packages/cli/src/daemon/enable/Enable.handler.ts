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
import { IDaemonCmdResult } from "../doc/IDaemonCmdResult";

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
        const cmdResult = this.enableDaemon();
        if ( cmdResult.success ) {
            cmdParams.response.console.log("Daemon mode enabled.\n" + cmdResult.msgText);
        } else {
            cmdParams.response.console.log("Failed to enable daemon mode.\n" + cmdResult.msgText);
        }
        return;
    }

    /**
     * Enable daemon mode. We extract our native executable and place it
     * in ZOWE_CLI_HOME/bin.
     *
     * @returns True upon success. False otherwise.
     */
    private enableDaemon(): IDaemonCmdResult {
        const cmdResult: IDaemonCmdResult = {
            success: true,
            msgText: ""
        };

        // determine our current OS

        // form the path to our prebuilds directory

        // find the tar file for our OS executable

        // form the path to our ZOWE_CLI_HOME bin directory

        // create the ZOWE_CLI_HOME bin directory if it does not exist

        // check the version of any existing executable

        // extract executable from the tar file into the bin directory

        // detect whether ZOWE_CLI_HOME/bin is already on our PATH

        // start the daemon if it is already on our PATH

        // Check if ZOWE_USE_DAEMON has a value

        // display results and directions to the user

        cmdResult.msgText = "Add ZOWE_CLI_HOME/bin to your path.";
        return cmdResult;
    }
}
