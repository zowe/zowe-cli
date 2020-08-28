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

import { AbstractSession, ImperativeExpect, Logger, ImperativeError, RestConstants, SessConstants } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../packages/rest";
import { LogoutConstants } from "./LogoutConstants";

/**
 * Class to handle logging out of APIML.
 * @export
 * @class Logout
 */
export class Logout {

    /**
     * Perform APIML logout to invalidate LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Login
     */
    public static async apimlLogout(session: AbstractSession) {
        Logger.getAppLogger().trace("Logout.logout()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        ImperativeExpect.toBeEqual(session.ISession?.tokenType, "apimlAuthenticationToken", "Token type for API ML logout must be apimlAuthenticationToken.");
        ImperativeExpect.toNotBeNullOrUndefined(session.ISession?.tokenValue, "Session token not populated. Unable to log out.");

        const client = new ZosmfRestClient(session);
        try{
            await client.request({
                request: "POST",
                resource: LogoutConstants.APIML_V1_RESOURCE
            });
        } catch (err) {
            if (!err.message.includes(LogoutConstants.APIML_V1_TOKEN_EXP_ERR)) {
                throw err;
            }
        }

        if (client.response.statusCode !== RestConstants.HTTP_STATUS_204) {
            if (!(client.response.statusCode === RestConstants.HTTP_STATUS_500 &&
                  client.dataString.includes(LogoutConstants.APIML_V1_TOKEN_EXP_ERR))) {
                throw new ImperativeError((client as any).populateError({
                    msg: `REST API Failure with HTTP(S) status ${client.response.statusCode}`,
                    causeErrors: client.dataString,
                    source: SessConstants.HTTP_PROTOCOL
                }));
            }
        }
    }
}
