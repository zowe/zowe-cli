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

import { AbstractSession, ImperativeExpect, TextUtils } from "@zowe/core-for-zowe-sdk";
import { noSession } from "@zowe/core-for-zowe-sdk";

/**
 * Class validates parameters for GetZosLog
 * @export
 * @class GetZosLogValidator
 */
export class GetZosLogValidator {
    /**
     * Validate session
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @memberof GetZosLogValidator
     */
    public static validateSession(session: AbstractSession) {
        ImperativeExpect.toNotBeNullOrUndefined(session, TextUtils.formatMessage(noSession.message));
    }
}
