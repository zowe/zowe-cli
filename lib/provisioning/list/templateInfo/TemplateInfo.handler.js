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
const imperative_1 = require("@zowe/imperative");
const provisioning_for_zowe_sdk_1 = require("@zowe/provisioning-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Handler to list template info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class TemplateInfoHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield provisioning_for_zowe_sdk_1.ListTemplateInfo.listTemplateCommon(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.name);
            let prettifiedTemplateInfo = {};
            if (commandParameters.arguments.allInfo) {
                prettifiedTemplateInfo = imperative_1.TextUtils.explainObject(response, provisioning_for_zowe_sdk_1.explainPublishedTemplateInfoFull, false);
            }
            else {
                prettifiedTemplateInfo = imperative_1.TextUtils.explainObject(response, provisioning_for_zowe_sdk_1.explainPublishedTemplateInfoSummary, false);
            }
            // Print out the response
            commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(prettifiedTemplateInfo));
            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);
        });
    }
}
exports.default = TemplateInfoHandler;
//# sourceMappingURL=TemplateInfo.handler.js.map