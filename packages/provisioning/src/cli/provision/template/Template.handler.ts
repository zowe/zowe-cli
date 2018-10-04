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

import { isNullOrUndefined } from "util";
import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { explainProvisionTemplateResponse, IProvisionOptionals, IProvisionTemplateResponse,
        ProvisioningConstants, ProvisionPublishedTemplate, ProvisioningService } from "../../../../../provisioning";

export default class Handler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {

        let response: IProvisionTemplateResponse;
        let usedOptionalParms: boolean = false;
        let arrayOfSystemNickNames: string[];

        const zosmfProfile = commandParameters.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.pass,
            base64EncodedAuth: zosmfProfile.auth,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        });
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
            response = await ProvisionPublishedTemplate.provisionTemplate(session, ProvisioningConstants.ZOSMF_VERSION,
                commandParameters.arguments.name, provisionOptionalParams);
        } else {
            response = await ProvisionPublishedTemplate.provisionTemplate(session, ProvisioningConstants.ZOSMF_VERSION,
                commandParameters.arguments.name);
        }

        let prettyResponse = TextUtils.explainObject(response, explainProvisionTemplateResponse, false);
        prettyResponse = TextUtils.prettyJson(prettyResponse);

        commandParameters.response.console.log(prettyResponse);

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }
}
