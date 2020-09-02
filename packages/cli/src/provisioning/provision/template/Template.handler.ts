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

import { isNullOrUndefined } from "util";
import { IHandlerParameters, TextUtils } from "@zowe/imperative";
import {
    explainProvisionTemplateResponse,
    IProvisionOptionals,
    IProvisionTemplateResponse,
    ProvisioningConstants,
    ProvisioningService,
    ProvisionPublishedTemplate
} from "../../../../../provisioning";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        let response: IProvisionTemplateResponse;
        let usedOptionalParms: boolean = false;
        let arrayOfSystemNickNames: string[];

        if (!isNullOrUndefined(commandParameters.arguments.systemNickNames)) {
            arrayOfSystemNickNames = commandParameters.arguments.systemNickNames.split(",").map((systemName: string) => {
                return systemName.trim();
            });
        }

        const provisionOptionalParams: IProvisionOptionals = ProvisioningService.checkForPassedOptionalParms(
            commandParameters.arguments.properties,
            commandParameters.arguments.propertiesFile,
            commandParameters.arguments.domainName,
            commandParameters.arguments.tenantName,
            commandParameters.arguments.userDataId,
            commandParameters.arguments.userData,
            commandParameters.arguments.accountInfo,
            arrayOfSystemNickNames
        );

        for (const property in provisionOptionalParams) {
            if (!isNullOrUndefined(provisionOptionalParams[property as keyof IProvisionOptionals])) {
                usedOptionalParms = true;
            }
        }

        if (usedOptionalParms) {
            response = await ProvisionPublishedTemplate.provisionTemplate(this.mSession, ProvisioningConstants.ZOSMF_VERSION,
                commandParameters.arguments.name, provisionOptionalParams);
        } else {
            response = await ProvisionPublishedTemplate.provisionTemplate(this.mSession, ProvisioningConstants.ZOSMF_VERSION,
                commandParameters.arguments.name);
        }

        let prettyResponse = TextUtils.explainObject(response, explainProvisionTemplateResponse, false);
        prettyResponse = TextUtils.prettyJson(prettyResponse);

        commandParameters.response.console.log(prettyResponse);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
