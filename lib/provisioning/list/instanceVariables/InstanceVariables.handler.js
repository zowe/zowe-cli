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
const provisioning_for_zowe_sdk_1 = require("@zowe/provisioning-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Handler to list instance variables
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class InstanceVariablesHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const registry = yield provisioning_for_zowe_sdk_1.ListRegistryInstances.listFilteredRegistry(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, null, commandParameters.arguments.name);
            const instances = registry["scr-list"];
            if ((0, util_1.isNullOrUndefined)(instances)) {
                commandParameters.response.console.error("No instance with name " +
                    commandParameters.arguments.name +
                    " was found");
            }
            else if (instances.length === 1) {
                const id = instances.pop()["object-id"];
                const variables = (yield provisioning_for_zowe_sdk_1.ListInstanceVariables.listVariablesCommon(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, id)).variables;
                commandParameters.response.format.output({
                    fields: ["name", "value", "visibility", "update-registry"],
                    output: variables,
                    format: "table",
                    header: true
                });
                commandParameters.response.data.setObj(variables);
            }
            else if (instances.length > 1) {
                commandParameters.response.console.error("Multiple instances with name " +
                    commandParameters.arguments.name +
                    " were found");
            }
        });
    }
}
exports.default = InstanceVariablesHandler;
//# sourceMappingURL=InstanceVariables.handler.js.map