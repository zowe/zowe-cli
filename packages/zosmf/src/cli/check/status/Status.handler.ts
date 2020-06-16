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

import { IHandlerParameters, TextUtils, ImperativeError } from "@zowe/imperative";
import { CheckStatus, IZosmfInfoResponse } from "../../../..";
import { CheckStatusMessages } from "../../constants/CheckStatus.messages";
import { ZosmfBaseHandler } from "../../../ZosmfBaseHandler";

/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        // our getZosmfInfo API does all of the work
        const zosResponse: IZosmfInfoResponse = await CheckStatus.getZosmfInfo(this.mSession);

        /* After a successful retrieval, collect the zosmf response object
         * into an object that provides a better display.
         */
        const mainZosmfProps = {
            zosmf_port: zosResponse.zosmf_port,
            zosmf_saf_realm: zosResponse.zosmf_saf_realm,
            zos_version: zosResponse.zos_version,
            zosmf_full_version: zosResponse.zosmf_full_version,
            api_version: zosResponse.api_version
        };

        // display the information that we got
        let userToDisplay: string;
        if (this.mSession.ISession.user === undefined ||
            this.mSession.ISession.user === null ||
            this.mSession.ISession.user.length === 0)
        {
            userToDisplay = "with a token";
        } else {
            userToDisplay = this.mSession.ISession.user;
        }

        commandParameters.response.console.log(
            TextUtils.formatMessage(CheckStatusMessages.cmdSucceeded.message, {
                userName: userToDisplay,
                hostName: zosResponse.zosmf_hostname,
                mainZosmfProps: TextUtils.prettyJson(mainZosmfProps),
                pluginStatus: TextUtils.prettyJson(zosResponse.plugins)
            })
        );

        // Return the original zosResponse when using --response-format-json
        commandParameters.response.data.setObj(zosResponse);
    }
}
