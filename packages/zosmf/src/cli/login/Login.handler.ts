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
     * Handler for the "zosmf login" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {

        // get a default built session
        const sessionConfig = this.mSession.ISession;

        // set users requested token type
        sessionConfig.tokenType = (params.arguments.jsonWebToken) ? "jwtToken" : "LtpaToken2";

        // force it to be a token connection
        sessionConfig.type = "token";

        // remove any existing token value
        delete sessionConfig.tokenValue;

        // establish a new session object
        const session = new Session(sessionConfig);

        // login to obtain a obtain token
        const tokenValue = await Login.login(session);

        // update the profile given
        await Imperative.api.profileManager(`zosmf`).update({
            name: this.mZosmfLoadedProfile.name,
            args: {
                "token-type": sessionConfig.tokenType,
                "token-value": tokenValue,
            },
            merge: true
        });

        // TODO(Kelosky): build other response stuff and do NOT print token
        this.console.log(`Login complete!`);
        console.log(tokenValue)
    }
}
