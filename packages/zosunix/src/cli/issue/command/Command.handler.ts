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

export default class CommandHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {

        const profile = params.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.password,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });
        let resp;
        if (params.arguments.cwd) {
            resp = await Shell.executeCommandCwd(session, params.arguments.command, params.arguments.cwd);
        } else {
            resp = await Shell.executeCommand(session, params.arguments.command);
        }
        params.response.console.log(resp);
    }
}
