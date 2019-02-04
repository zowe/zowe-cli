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

import { ICommandHandler, IHandlerParameters, TextUtils, Session } from "@brightside/imperative";
import { Shell } from "../../../api/Shell";
import { ClientChannel } from "ssh2";

export default class CommandHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        const profile = params.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: profile.host,
            user: profile.user,
            password: profile.password,
        });

        if (params.arguments.cwd) {
            // await Shell.executeSshCwd(params.arguments.command, params.arguments.cwd);
        } else {
            Shell.executeSsh(session, params.arguments.command, (stream: ClientChannel) => {
            stream.on("data", (data: string) => {
                if (!data.includes("exit")) {
                    process.stdout.write(data);
                }
            }).stderr.on("data", (data: string) => {
                if (!data.includes("exit")) {
                    process.stderr.write(data);
                }
            });
        });
        }
    }
}
