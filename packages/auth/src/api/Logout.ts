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

import { AbstractSession, ImperativeExpect, Logger, ImperativeError, HTTP_VERB, RestConstants, SessConstants } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../rest";

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
    public static async apimlLogout(session: AbstractSession, request: HTTP_VERB, resource: string) {
        Logger.getAppLogger().trace("Logout.logout()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");

        const client = new ZosmfRestClient(session);
        await client.request({
            request,
            resource
        });

        ImperativeExpect.toNotBeNullOrUndefined(session.ISession.tokenValue, "Session token not populated. Unable to logout.");

        if (client.response.statusCode !== RestConstants.HTTP_STATUS_204) {
            throw (client as any).populateError({
                msg: `REST API Failure with HTTP(S) Status ${client.response.statusCode}`,
                source: SessConstants.HTTP_PROTOCOL
            });
        }
    }
}
