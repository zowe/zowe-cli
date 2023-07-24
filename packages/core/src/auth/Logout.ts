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
import { ZosmfRestClient } from "../rest/ZosmfRestClient";
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
     * @memberof Logout
     */
    public static async apimlLogout(session: AbstractSession) {
        Logger.getAppLogger().trace("Logout.logout()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        ImperativeExpect.toMatchRegExp(session.ISession.tokenType, "^apimlAuthenticationToken.*",
            `Token type (${session.ISession.tokenType}) for API ML logout must start with 'apimlAuthenticationToken'.`);
        ImperativeExpect.toNotBeNullOrUndefined(session.ISession.tokenValue, "Session token not populated. Unable to log out.");

        const client = new ZosmfRestClient(session);
        if(!session.ISession.basePath) {
            session.ISession.basePath = "/"; // prevent basepath requirement error on invalid credentials
        }
        try{
            await client.request({
                request: "POST",
                resource: LogoutConstants.APIML_V1_RESOURCE
            });
        } catch (err) {
            let errorToThrow = err;
            for (const errorKey in LogoutConstants.APIML_V2_LOGOUT_ERR_LIST) {
                if (err.message.includes(LogoutConstants.APIML_V2_LOGOUT_ERR_LIST[errorKey])) {
                    switch (errorKey) {
                        case "V2_TOKEN_INVALID": // Token is invalid (logged out)
                        case "V2_TOKEN_EXPIRED": // Token expired (trully expired)
                        case "V2_TOKEN_MISSING": // Token type is not ^apimlAuthenticationToken.*
                            errorToThrow = new ImperativeError({
                                msg: "Token is not valid or expired.\n" +
                                    "For CLI usage, see `zowe auth logout apiml --help`",
                                errorCode: client.response.statusCode.toString()
                            });
                            break;
                        case "V1_TOKEN_EXPIRED":
                        default:
                            errorToThrow = null;
                            break;
                    }
                }
            }

            if (errorToThrow) {
                throw errorToThrow;
            }
        } finally {
            if (session.ISession.basePath === "/") {
                session.ISession.basePath = AbstractSession.DEFAULT_BASE_PATH;
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
