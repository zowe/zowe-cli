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

import { ICommandHandler, IHandlerParameters } from "../../../cmd";

/**
 * Handler for the auto-generated show dependencies command
 */
export default class ShowDependenciesProfilesHandler implements ICommandHandler {

    /**
     * The process command handler for the "show dependencies" command.
     * @return {Promise<ICommandResponse>}: The promise to fulfill when complete.
     */
    public process(commandParameters: IHandlerParameters): Promise<void> {
        return new Promise<void>((commandComplete) => {

            // Do nothing
            // Need for this minimized by list --verbose
            commandComplete();
        });
    }
}
