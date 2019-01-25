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

import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { explainPublishedTemplateInfoFull, explainPublishedTemplateInfoSummary, ListTemplateInfo } from "../../../../";
import { IPublishedTemplateInfo, ProvisioningConstants } from "../../../../index";

/**
 * Handler to list template info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class TemplateInfoHandler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {
        const profile = commandParameters.profiles.get("zosmf");

        const session = new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.pass,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });

        const response: IPublishedTemplateInfo = await ListTemplateInfo.listTemplateCommon(
            session, ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.name);

        let prettifiedTemplateInfo: any = {};
        if (commandParameters.arguments.allInfo) {
            prettifiedTemplateInfo = TextUtils.explainObject(response, explainPublishedTemplateInfoFull, false);
        } else {
            prettifiedTemplateInfo = TextUtils.explainObject(response, explainPublishedTemplateInfoSummary, false);
        }
        // Print out the response
        commandParameters.response.console.log(TextUtils.prettyJson(prettifiedTemplateInfo));


        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
