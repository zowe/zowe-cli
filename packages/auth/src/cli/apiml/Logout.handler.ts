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
    SessConstants
} from "@zowe/imperative";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";
import { Login } from "../../api/Login";

/**
 * Handler to login to z/OSMF
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class ApimlHandler extends ZosmfBaseHandler {
    // Todo:Gene Do not extend ZosmfBaseHandler after implementing apiml login
    /**
     * Handler for the "zosmf login" command.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        // we want to receive a token in our response
        this.mSession.ISession.type = SessConstants.AUTH_TYPE_TOKEN;

        // set the type of token we expect to receive
        if (params.arguments.tokenType) {
            // use the token type requested by the user
            this.mSession.ISession.tokenType = params.arguments.tokenType;
        } else {
            // use our default token
            this.mSession.ISession.tokenType = SessConstants.TOKEN_TYPE_LTPA;
        }

        // login to obtain a token
        const tokenValue = await Login.login(this.mSession);

        // update the profile given
        await Imperative.api.profileManager(`zosmf`).update({
            name: this.mZosmfLoadedProfile.name,
            args: {
                "token-type": this.mSession.ISession.tokenType,
                "token-value": tokenValue
            },
            merge: true
        });

        params.response.console.log(
            "Login successful.\nReceived a token of type = " + this.mSession.ISession.tokenType +
            ".\nThe following token was stored in your profile:\n" + tokenValue
        );
    }
}
