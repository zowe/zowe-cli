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

import { IHandlerParameters, IHandlerResponseConsoleApi } from "@zowe/imperative";
import { Shell } from "../../../api/Shell";
import { ClientChannel } from "ssh2";
import { SshBaseHandler } from "../../../SshBaseHandler";

/**
 * Handle to issue an USS ssh command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends SshBaseHandler {

    private parameters: IHandlerParameters;

    public async processCmd(commandParameters: IHandlerParameters) {
        this.parameters = commandParameters;
        if (commandParameters.arguments.cwd) {
            await Shell.executeSshCwd(this.mSession, commandParameters.arguments.command, commandParameters.arguments.cwd,
                this.handleStdout.bind(this));
        } else {
            await Shell.executeSsh(this.mSession, commandParameters.arguments.command, this.handleStdout.bind(this));
        }
    }

    public handleStdout(data: string) {
        this.parameters.response.console.log(data);
    }
}
