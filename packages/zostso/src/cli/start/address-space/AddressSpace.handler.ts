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

import { ICommandHandler, IHandlerParameters, Session, TextUtils, ImperativeError } from "@brightside/imperative";
import { IStartStopResponses, IStartTsoParms, IZosmfTsoResponse, StartTso } from "../../../../../zostso";


/**
 * Handler to start an address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {

        let response: IStartStopResponses;
        const zosmfProfile = commandParameters.profiles.get("zosmf");
        const tsoProfile: IStartTsoParms = commandParameters.profiles.get("tso") as IStartTsoParms;
        const session = new Session({
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.pass,
            base64EncodedAuth: zosmfProfile.auth,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        });

        response = await StartTso.start(session, tsoProfile.account, tsoProfile);
        commandParameters.response.data.setObj(response);

        if (response.success) {
            commandParameters.response.console.log(`TSO address space began successfully, key is: ${response.servletKey}\n`);
            commandParameters.response.console.log(response.messages);
        } else {
            throw new ImperativeError({
                msg: `TSO address space failed to start.`,
                additionalDetails: response.failureResponse.message
            });
        }
    }
}
