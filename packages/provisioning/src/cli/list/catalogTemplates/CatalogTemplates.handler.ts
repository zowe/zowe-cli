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
import { explainPublishedTemplatesFull, explainPublishedTemplatesSummary, ListCatalogTemplates, ProvisioningConstants } from "../../../../";
import { IPublishedTemplates } from "../../../../index";

/**
 * Handler to list template catalog
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class CatalogTemplatesHandler implements ICommandHandler {

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

        const templates: IPublishedTemplates = await ListCatalogTemplates.listCatalogCommon(session, ProvisioningConstants.ZOSMF_VERSION);

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
