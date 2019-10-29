
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
import { AbstractSession, ImperativeExpect, Logger } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../rest";
import { LogonConstants } from "./LogonConstants";

/**
 * Class to handle logging onto z/OSMF.
 * @export
 * @class Logon
 */
export class Logon {

    /**
     * Perform z/OSMF logon to obtain LTPA2 or other token types.
     * @static
     * @param {AbstractSession} session
     * @returns
     * @memberof Logon
     */
    public static async logon(session: AbstractSession) {
        Logger.getAppLogger().trace("Logon.logon()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        const response = await ZosmfRestClient.getExpectJSON<any>(session, LogonConstants.RESOURCE);
        return session.ISession.tokenValue;
    }

}
