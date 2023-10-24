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
const util_1 = require("util");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Handler to list instance info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class InstanceInfoHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const registry = yield provisioning_for_zowe_sdk_1.ListRegistryInstances.listFilteredRegistry(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, null, commandParameters.arguments.name);
            const instances = registry["scr-list"];
            if ((0, util_1.isNullOrUndefined)(instances)) {
                commandParameters.response.console.error("No instance with name " + commandParameters.arguments.name + " was found");
            }
            else if (instances.length === 1) {
                const id = instances.pop()["object-id"];
                const response = yield provisioning_for_zowe_sdk_1.ListInstanceInfo.listInstanceCommon(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, id);
                const pretty = this.formatProvisionedInstanceSummaryOutput(response, commandParameters.arguments.display);
                commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(pretty));
                commandParameters.response.data.setObj(response);
            }
            else if (instances.length > 1) {
                commandParameters.response.console.error("Multiple instances with name " + commandParameters.arguments.name + " were found");
            }
        });
    }
    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instance: one or more provisioned instance
     * @param option: command options
     */
    formatProvisionedInstanceSummaryOutput(instance, option) {
        let prettifiedInstance = {};
        option = (0, util_1.isNullOrUndefined)(option) ? "ACTIONS" : option.toUpperCase();
        // Prettify the output
        switch (option) {
            // extended general information with actions summarised
            case "EXTENDED":
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceExtended, false);
                break;
            // summary info with actions
            case "SUMMARY":
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceSummary, false);
                break;
            // summary info with variables
            case "VARS":
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceSummaryWithVars, false);
                break;
            // summary info with extended actions and variables
            case "FULL":
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceFull, false);
                break;
            // default - summary with actions, variables ignored
            case "ACTIONS":
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceSummaryWithActions, false);
                break;
            default:
                prettifiedInstance = imperative_1.TextUtils.explainObject(instance, provisioning_for_zowe_sdk_1.explainProvisionedInstanceSummaryWithActions, false);
                break;
        }
        return prettifiedInstance;
    }
}
exports.default = InstanceInfoHandler;
//# sourceMappingURL=InstanceInfo.handler.js.map