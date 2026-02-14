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

import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import { ChangePassword, IChangePassword, ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Handler to change a z/OS password via the z/OSMF REST API.
 * @export
 * @class ChangePasswordHandler
 * @extends {ZosmfBaseHandler}
 */
export default class ChangePasswordHandler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {
        const user = this.mSession.ISession.user;

        if (!user) {
            throw new ImperativeError({
                msg: "Username is required to change a z/OS password or passphrase. " +
                     "Provide the --user option or configure it in your zosmf profile."
            });
        }

        const oldPwd = await commandParameters.response.console.prompt(
            "Enter current password or passphrase: ", { hideText: true }
        );
        if (!oldPwd) {
            throw new ImperativeError({
                msg: "Current password or passphrase is required."
            });
        }

        const newPwd = await commandParameters.response.console.prompt(
            "Enter new password or passphrase: ", { hideText: true }
        );
        if (!newPwd) {
            throw new ImperativeError({
                msg: "New password or passphrase is required."
            });
        }

        const response: IChangePassword = await ChangePassword.zosmfChangePassword(
            this.mSession,
            user,
            oldPwd,
            newPwd
        );

        commandParameters.response.console.log("Successfully changed password or passphrase.");
        commandParameters.response.data.setObj(response);
    }
}
