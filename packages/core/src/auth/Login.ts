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

import { AbstractSession, ImperativeExpect, Logger, RestConstants, SessConstants, ImperativeError } from "@zowe/imperative";
import { ZosmfRestClient } from "../rest/ZosmfRestClient";
import { LoginConstants } from "./LoginConstants";

/**
 * Class to handle logging onto APIML.
 * @export
 * @class Login
 */
export class Login {

    /**
     * Perform APIML login to obtain LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Login
     */
    public static async apimlLogin(session: AbstractSession) {
        Logger.getAppLogger().trace("Login.login()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        ImperativeExpect.toMatchRegExp(session.ISession.tokenType, "^apimlAuthenticationToken.*",
            `Token type (${session.ISession.tokenType}) for API ML token login must start with 'apimlAuthenticationToken'.`);

        const client = new ZosmfRestClient(session);
        await client.request({
            request: "POST",
            resource: LoginConstants.APIML_V1_RESOURCE
        });

        if (client.response.statusCode !== RestConstants.HTTP_STATUS_204) {
            throw new ImperativeError((client as any).populateError({
                msg: `REST API Failure with HTTP(S) status ${client.response.statusCode}`,
                causeErrors: client.dataString,
                source: SessConstants.HTTP_PROTOCOL
            }));
        }

        // return token to the caller
        return session.ISession.tokenValue;
    }

}
