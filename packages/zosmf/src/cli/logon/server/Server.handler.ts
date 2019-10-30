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
import { ZosmfBaseHandler } from "../../../ZosmfBaseHandler";
import { Logon } from "../../../api/Logon";

/**
 * Handler to logon to z/OSMF
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class LogonServerHandler extends ZosmfBaseHandler {

    /**
     * Handler for the "zos-jobs list jobs" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {

        // get existing session
        const sessionConfig = this.mSession.ISession;

        // make it a token connection
        sessionConfig.type = "token";
        sessionConfig.tokenType = (params.arguments.jsonWebToken) ? "jwtToken" : "LtpaToken2";
        const session = new Session(sessionConfig);

        // obtain token
        const tokenValue = await Logon.logon(session);

        if (tokenValue) {
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
            this.console.log(`Logon complete!`);

        } else {
            // TODO(Kelosky): most ideally we'll get a 401 or some other HTTP error for invalid users; 
            // we need our systems configured properly for this.
            throw new ImperativeError({
                msg: "You are a failure.",
            });
        }

    }
}
