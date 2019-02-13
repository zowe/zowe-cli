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

import { IHandlerParameters } from "@brightside/imperative";
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

    public streamCallBack(stream: ClientChannel) {
        stream.on("data", (data: string) => {
            if (!data.includes("exit")) {
                process.stdout.write(data);
            }
        }).stderr.on("data", (data: string) => {
            if (!data.includes("exit")) {
                process.stderr.write(data);
            }
        });
    }

    public async processCmd(commandParameters: IHandlerParameters) {
        if (commandParameters.arguments.cwd) {
            // Shell.executeSshCwd(session, commandParameters.arguments.command, commandParameters.arguments.cwd, this.streamCallBack);
            Shell.executeSshCwd(this.mSession, commandParameters.arguments.command, commandParameters.arguments.cwd, this.streamCallBack);
        } else {
            // Shell.executeSsh(session, commandParameters.arguments.command, this.streamCallBack);
            Shell.executeSsh(this.mSession, commandParameters.arguments.command, this.streamCallBack);
        }
    }
}
