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
const zos_workflows_for_zowe_sdk_1 = require("@zowe/zos-workflows-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Common Handler for listing archived workflows for a system.
 */
class ListArchivedWorkflowsHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Handler process - invoked by the command processor to handle the "zos-workflows archived list"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ListArchivedWorkflowsHandler
     */
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = commandParameters.arguments;
            let response;
            let error;
            const width = 42;
            try {
                response = yield zos_workflows_for_zowe_sdk_1.ListArchivedWorkflows.listArchivedWorkflows(this.mSession);
            }
            catch (err) {
                error = "List workflow(s) " + err;
                throw error;
            }
            commandParameters.response.data.setObj(response);
            response.archivedWorkflows.forEach((archivedWorkflows) => {
                archivedWorkflows.workflowName = imperative_1.TextUtils.wordWrap(`${archivedWorkflows.workflowName}`, width);
                archivedWorkflows.workflowKey = imperative_1.TextUtils.wordWrap(`${archivedWorkflows.workflowKey}`, width);
            });
            // Format & print the response
            if (response.archivedWorkflows.length) {
                commandParameters.response.format.output({
                    fields: ["workflowName", "workflowKey"],
                    output: response.archivedWorkflows,
                    format: "table",
                    header: true
                });
            }
            else {
                commandParameters.response.console.log("No workflows match the requested query");
            }
        });
    }
}
exports.default = ListArchivedWorkflowsHandler;
//# sourceMappingURL=ArchivedWorkflows.handler.js.map