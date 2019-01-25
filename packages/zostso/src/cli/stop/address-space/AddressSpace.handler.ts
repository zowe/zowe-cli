/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandHandler, IHandlerParameters, Session } from "@brightside/imperative";
import { IStartStopResponse, StopTso } from "../../../../../zostso";

export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {

        let response: IStartStopResponse;
        const zosmfProfile = commandParameters.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.pass,
            base64EncodedAuth: zosmfProfile.auth,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        });
        const servletKey = commandParameters.arguments.servletkey;
        response = await StopTso.stop(session, servletKey);

        commandParameters.response.console.log(`TSO address space ended successfully, key was: ${response.servletKey}`);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
