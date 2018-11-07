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

import { IHandlerParameters, TextUtils } from "@brightside/imperative";
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
        let zosResponse: IZosmfInfoResponse = null;
        try {
            zosResponse = await CheckStatus.getZosmfInfo(this.mSession);
        }
        catch (impErr) {
            commandParameters.response.console.error(TextUtils.chalk.red(
                TextUtils.formatMessage(CheckStatusMessages.cmdFailed.message, {
                    userName: commandParameters.arguments.user,
                    hostName: commandParameters.arguments.host,
                    portNum: commandParameters.arguments.port,
                    reasonMsg: impErr.message
                })
            ));
            return;
        }

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
        commandParameters.response.console.log(
            TextUtils.formatMessage(CheckStatusMessages.cmdSucceeded.message, {
                userName: commandParameters.arguments.user,
                hostName: zosResponse.zosmf_hostname,
                mainZosmfProps: TextUtils.prettyJson(mainZosmfProps),
                pluginStatus: TextUtils.prettyJson(zosResponse.plugins)
            })
        );

        // Return the original zosResponse when using --response-format-json
        commandParameters.response.data.setObj(zosResponse);
    }
}
