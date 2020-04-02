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

import { AbstractSession, ImperativeExpect, Logger, ImperativeError, RestConstants } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../rest";
import { LoginConstants } from "./LoginConstants";

/**
 * Class to handle logging onto z/OSMF.
 * @export
 * @class Login
 */
export class Login {

    /**
     * Perform z/OSMF login to obtain LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Login
     */
    public static async login(session: AbstractSession) {
        Logger.getAppLogger().trace("Login.login()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");

        // TODO(Kelosky): we eventually will hope to use a real z/OSMF authentication endpoint
        // get client instance and perform a get on /zosmf/info
        const client = new ZosmfRestClient(session);
        await client.request({
            request: "GET",
            resource: LoginConstants.RESOURCE
        });

        // NOTE(Kelosky): since this endpoint doesn't require authentication, we treat a missing LTPA2 token
        // as unauthorized and simulate a 401 (so that the error messaging will not change when we have a
        // true authentication endpoint)
        if (session.ISession.tokenValue === undefined) {

            // pretend it was a basic auth error with 401 when obtaining the token
            client.response.statusCode = RestConstants.HTTP_STATUS_401;
            (session as any).mISession.type = "basic";

            // throw as HTTP(S) error
            throw (client as any).populateError({
                msg: "Rest API failure with HTTP(S) status 401",
                source: "http"
            });
        }

        // return token to the caller
        return session.ISession.tokenValue;
    }

}
