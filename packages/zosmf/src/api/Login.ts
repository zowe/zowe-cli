
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
import { AbstractSession, ImperativeExpect, Logger, ImperativeError } from "@zowe/imperative";
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
        await ZosmfRestClient.getExpectJSON<any>(session, LoginConstants.RESOURCE); // TODO(Kelosky): eventually a real auth endpoint
        return session.ISession.tokenValue;
    }

}
