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
import { IChangePasswordParms } from "./doc/IChangePasswordParms";
import { IChangePasswordResponse } from "./doc/IChangePasswordResponse";

/**
 * Generic class to handle password change operations.
 * @export
 * @class ChangePassword
 */
export class ChangePassword {
    /**
     * Perform a password change operation.
     * @param {AbstractSession} session The session containing the  current credentials.
     * @param {IChangePasswordParms} parms Parameters for the password change.
     * @param {(session: AbstractSession, parms: IChangePasswordParms) => Promise<IChangePasswordResponse>} changeFunc
     *   Ssupplied function that performs the actual password change and returns an {@link IChangePasswordResponse}.
     * @returns {Promise<IChangePasswordResponse>} The response from the password change operation.
     */
    public static async changePassword(
        session: AbstractSession,
        parms: IChangePasswordParms,
        changeFunc: (session: AbstractSession, parms: IChangePasswordParms) => Promise<IChangePasswordResponse>
    ): Promise<IChangePasswordResponse> {
        Logger.getAppLogger().trace("ChangePassword.changePassword()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(parms, "Change password parameters must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(parms.newPassword, "New password must be defined");

        return changeFunc(session, parms);
    }
}
