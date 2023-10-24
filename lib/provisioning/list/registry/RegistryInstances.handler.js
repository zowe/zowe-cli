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
 * Handler to list registry instances
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class RegistryInstancesHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield provisioning_for_zowe_sdk_1.ListRegistryInstances.listFilteredRegistry(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, commandParameters.arguments.filterByType, commandParameters.arguments.filterByExternalName);
            const instances = response["scr-list"];
            const pretty = imperative_1.TextUtils.prettyJson(this.formatProvisionedInstancesSummaryOutput(instances, commandParameters.arguments.allInfo));
            // Print out the response
            if (commandParameters.arguments.types) {
                commandParameters.response.console.log("z/OSMF Service Registry " +
                    "- Types of Provisioned Instances.\n");
                const unique = [...new Set(instances.map((item) => item.type))];
                commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(unique));
            }
            else {
                commandParameters.response.console.log("z/OSMF Service Registry");
                if (!(0, util_1.isNullOrUndefined)(commandParameters.arguments.filterByType)) {
                    commandParameters.response.console.log("\nShowing ONLY \""
                        + commandParameters.arguments.filterByType.toUpperCase() + "\" instance types.");
                }
                commandParameters.response.console.log(pretty);
            }
            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);
        });
    }
    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instances: one or more provisioned instance
     * @param showAllInfo : display summary (default) or all information fields
     */
    formatProvisionedInstancesSummaryOutput(instances, showAllInfo) {
        // Use defined pretty print template - IProvisionedInstancePrettyFull for displaying info
        let prettifiedInstances = [];
        if (showAllInfo) {
            prettifiedInstances = imperative_1.TextUtils.explainObject(instances, provisioning_for_zowe_sdk_1.explainProvisionedInstanceFull, true);
        }
        else {
            prettifiedInstances = imperative_1.TextUtils.explainObject(instances, provisioning_for_zowe_sdk_1.explainProvisionedInstanceSummary, false);
        }
        return prettifiedInstances;
    }
}
exports.default = RegistryInstancesHandler;
//# sourceMappingURL=RegistryInstances.handler.js.map