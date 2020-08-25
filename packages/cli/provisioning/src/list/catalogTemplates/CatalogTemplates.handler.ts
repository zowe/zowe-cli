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
import { explainPublishedTemplatesFull, explainPublishedTemplatesSummary, ListCatalogTemplates, ProvisioningConstants } from "../../../../../../packages/provisioning";
import { IPublishedTemplates } from "../../../../../provisioning/src/index";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Handler to list template catalog
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class CatalogTemplatesHandler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const templates: IPublishedTemplates = await ListCatalogTemplates.listCatalogCommon(this.mSession, ProvisioningConstants.ZOSMF_VERSION);

        let prettifiedTemplates: any = {};
        if (commandParameters.arguments.allInfo) {
            prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesFull,
                true);
        } else {
            prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesSummary,
                false);
        }
        let response = "z/OSMF Service Catalog templates\n";
        response = response + TextUtils.prettyJson(prettifiedTemplates);
        // Print out the response
        commandParameters.response.console.log(response);


        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(templates);
    }
}
