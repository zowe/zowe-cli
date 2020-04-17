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

import { IHandlerParameters, ProfilesConstants, Imperative, Session, ImperativeError } from "@zowe/imperative";
import { ZosmfBaseHandler } from "../../ZosmfBaseHandler";
import { Login } from "../../api/Login";

/**
 * Handler to login to z/OSMF
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class LoginHandler extends ZosmfBaseHandler {

    /**
     * Handler for the "zosmf login" command.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {

        // modify our current session for use with the login command
        // removing tokenValue, will require a user & password for login
        delete this.mSession.ISession.tokenValue;

        // we want to receive a token in our response
        this.mSession.ISession.type = "token";

        // set the type of token we expect to receive
        if (params.arguments.tokenType) {
            // use the token type requested by the user
            this.mSession.ISession.tokenType = params.arguments.tokenType;
        } else {
            // use our default APIML token
            this.mSession.ISession.tokenType = "LtpaToken2"; // Todo:Gene: replace this zosmf hack with "apimlAuthenticationToken"
        }

        // Create a new session to validate user's values with our modifications
        let loginSess;
        try {
            loginSess = new Session(this.mSession.ISession);
        }
        catch (impErr) {
            // remove error text about allowing a token - not applicable for login command itself
            throw new ImperativeError({
                msg: impErr.message.replace(" OR tokenType & tokenValue", ""),
                additionalDetails: impErr.additionalDetails
            });
        }

        // login to obtain a token
        const tokenValue = await Login.login(loginSess);

        // update the profile given
        await Imperative.api.profileManager(`zosmf`).update({
            name: this.mZosmfLoadedProfile.name,
            args: {
                "token-type": loginSess.ISession.tokenType,
                "token-value": tokenValue
            },
            merge: true
        });

        params.response.console.log(
            "Login successful.\nReceived a token of type = " + loginSess.ISession.tokenType +
            ".\nThe following token was stored in your profile:\n" + tokenValue
        );
    }
}
