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
    IHandlerParameters,
    Imperative,
    SessConstants,
    ICommandHandler,
    ISession,
    IOptionsForAddCreds,
    CredsForSessCfg,
    AbstractSession,
    Session
} from "@zowe/imperative";
import { LoginConstants } from "../../api/LoginConstants";
import { Login } from "../../api/Login";
import { ZosmfSession } from "../../../../zosmf/src/api/ZosmfSession";

/**
 * Handler to login to z/OSMF
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class ApimlHandler implements ICommandHandler {
    /**
     * The session creating from the command line arguments / profile
     */
    protected mSession: AbstractSession;

    /**
     * Handler for the "auth login apiml" command.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const baseLoadedProfile = params.profiles.getMeta("base", false);

        const sessCfg: ISession = ZosmfSession.createSessCfgFromArgs(
            params.arguments
        );

        const sessCfgWithCreds = await CredsForSessCfg.addCredsOrPrompt<ISession>(
            sessCfg, params.arguments, { requestToken: true }
        );

        this.mSession = new Session(sessCfgWithCreds);

        // we want to receive a token in our response
        this.mSession.ISession.type = SessConstants.AUTH_TYPE_TOKEN;

        // use our default token
        this.mSession.ISession.tokenType = SessConstants.TOKEN_TYPE_APIML;

        // login to obtain a token
        const tokenValue = await Login.login(this.mSession, "POST", LoginConstants.APIML_V1_RESOURCE);

        // update the profile given
        await Imperative.api.profileManager(`base`).update({
            name: baseLoadedProfile.name,
            args: {
                "token-type": this.mSession.ISession.tokenType,
                "token-value": tokenValue
            },
            merge: true
        });

        params.response.console.log("Login successful.");

        if (params.arguments.showToken) {
            params.response.console.log(
                "\nReceived a token of type = " + this.mSession.ISession.tokenType +
                ".\nThe following token was stored in your profile:\n" + tokenValue
            );
        }
    }
}
