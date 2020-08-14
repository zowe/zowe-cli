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

import { IHandlerParameters, TextUtils } from "@zowe/imperative";
import { explainPublishedTemplateInfoFull, explainPublishedTemplateInfoSummary, ListTemplateInfo } from "../../../../";
import { IPublishedTemplateInfo, ProvisioningConstants } from "../../../../index";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Handler to list template info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class TemplateInfoHandler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const response: IPublishedTemplateInfo = await ListTemplateInfo.listTemplateCommon(
            this.mSession, ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.name);

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
