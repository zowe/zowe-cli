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
const zos_workflows_for_zowe_sdk_1 = require("@zowe/zos-workflows-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Common Handler for retrieving the contents of a z/OSMF workflow definition from a z/OS system.
 */
class ListActiveWorkflowsHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Handler process - invoked by the command processor to handle the "zos-workflows list"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ListHandler
     */
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = commandParameters.arguments;
            let response;
            let error;
            try {
                response = yield zos_workflows_for_zowe_sdk_1.DefinitionWorkflow.getWorkflowDefinition(this.mSession, undefined, this.arguments.definitionFilePath, this.arguments.listSteps, this.arguments.listVariables);
            }
            catch (err) {
                error = "List workflow(s) " + err;
                throw error;
            }
            commandParameters.response.data.setObj(response);
            commandParameters.response.console.log("\nWorkflow Details: ");
            commandParameters.response.format.output({
                fields: ["workflowDefaultName", "workflowDescription", "workflowID"],
                output: response,
                format: "object"
            });
            if (this.arguments.listSteps && response.steps) {
                commandParameters.response.console.log("\nWorkflow Steps: ");
                commandParameters.response.format.output({
                    fields: ["name", "title", "description"],
                    output: response.steps,
                    format: "table",
                    header: true
                });
            }
            if (this.arguments.listVariables && response.variables) {
                commandParameters.response.console.log("\nWorkflow Variables: ");
                commandParameters.response.format.output({
                    fields: ["name", "description", "type"],
                    output: response.variables,
                    format: "table",
                    header: true
                });
            }
        });
    }
}
exports.default = ListActiveWorkflowsHandler;
//# sourceMappingURL=RetrieveWorkflowDefinition.handler.js.map