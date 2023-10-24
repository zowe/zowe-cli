"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const imperative_1 = require("@zowe/imperative");
const provisioning_for_zowe_sdk_1 = require("@zowe/provisioning-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
class Handler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            let usedOptionalParms = false;
            let arrayOfSystemNickNames;
            if (!(0, util_1.isNullOrUndefined)(commandParameters.arguments.systemNickNames)) {
                arrayOfSystemNickNames = commandParameters.arguments.systemNickNames
                    .split(",")
                    .map((systemName) => {
                    return systemName.trim();
                });
            }
            const provisionOptionalParams = provisioning_for_zowe_sdk_1.ProvisioningService.checkForPassedOptionalParms(commandParameters.arguments.properties, commandParameters.arguments.propertiesFile, commandParameters.arguments.domainName, commandParameters.arguments.tenantName, commandParameters.arguments.userDataId, commandParameters.arguments.userData, commandParameters.arguments.accountInfo, arrayOfSystemNickNames);
            for (const property in provisionOptionalParams) {
                if (!(0, util_1.isNullOrUndefined)(provisionOptionalParams[property])) {
                    usedOptionalParms = true;
                }
            }
            if (usedOptionalParms) {
                response = yield provisioning_for_zowe_sdk_1.ProvisionPublishedTemplate.provisionTemplate(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.name, provisionOptionalParams);
            }
            else {
                response = yield provisioning_for_zowe_sdk_1.ProvisionPublishedTemplate.provisionTemplate(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.name);
            }
            let prettyResponse = imperative_1.TextUtils.explainObject(response, provisioning_for_zowe_sdk_1.explainProvisionTemplateResponse, false);
            prettyResponse = imperative_1.TextUtils.prettyJson(prettyResponse);
            commandParameters.response.console.log(prettyResponse);
            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=Template.handler.js.map