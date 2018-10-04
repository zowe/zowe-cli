/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandHandler, IExplanationMap, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { CheckStatus, IZosmfInfoResponse } from "../../../..";
import { CheckStatusMessages } from "../../constants/CheckStatus.messages";
import { ZosmfSession } from "../../../../../zosmf";

/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {

        // use the user's zosmf profile to create a session to the desired zosmf subsystem
        const profile = commandParameters.profiles.get("zosmf");
        const session = ZosmfSession.createBasicZosmfSession(profile);

        // our getZosmfInfo API does all of the work
        let zosResponse: IZosmfInfoResponse = null;
        try {
            zosResponse = await CheckStatus.getZosmfInfo(session);
        }
        catch (impErr) {
            commandParameters.response.console.error(TextUtils.chalk.red(
                TextUtils.formatMessage(CheckStatusMessages.cmdFailed.message, {
                    userName: profile.user,
                    hostName: profile.host,
                    portNum: profile.port,
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
                userName: profile.user,
                hostName: zosResponse.zosmf_hostname,
                mainZosmfProps: TextUtils.prettyJson(mainZosmfProps),
                pluginStatus: TextUtils.prettyJson(zosResponse.plugins)
            })
        );

        // Return the original zosResponse when using --response-format-json
        commandParameters.response.data.setObj(zosResponse);
    }
}
