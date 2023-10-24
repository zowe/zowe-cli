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
 * Handler to perform action against instance
 * @export
 * @class ActionHandler
 * @implements {ICommandHandler}
 */
class ActionHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
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
                const response = yield provisioning_for_zowe_sdk_1.PerformAction.doProvisioningActionCommon(this.mSession, provisioning_for_zowe_sdk_1.ProvisioningConstants.ZOSMF_VERSION, id, commandParameters.arguments.actionname);
                const pretty = imperative_1.TextUtils.explainObject(response, provisioning_for_zowe_sdk_1.explainActionResponse, false);
                commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(pretty));
                commandParameters.response.data.setObj(response);
            }
            else if (instances.length > 1) {
                commandParameters.response.console.error("Multiple instances with name " +
                    commandParameters.arguments.name +
                    " were found");
            }
        });
    }
}
exports.default = ActionHandler;
//# sourceMappingURL=Action.handler.js.map