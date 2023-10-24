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
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
const zos_workflows_for_zowe_sdk_1 = require("@zowe/zos-workflows-for-zowe-sdk");
/**
 * A Handler for listing details of a workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */
class ActiveWorkflowDetails extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows list active-workflow-details"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof PropertiesCommonHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            let workflowKey;
            let response;
            let requireSteps;
            let stepSummaries = [];
            let error;
            if (this.arguments.workflowKey) {
                workflowKey = this.arguments.workflowKey;
            }
            else if (this.arguments.workflowName) {
                workflowKey = yield zos_workflows_for_zowe_sdk_1.ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
                if (!workflowKey) {
                    throw new imperative_1.ImperativeError({
                        msg: `No workflows match the provided workflow name.`,
                        additionalDetails: JSON.stringify(params)
                    });
                }
            }
            this.arguments.listSteps || this.arguments.stepsSummaryOnly ? requireSteps = true : requireSteps = false;
            try {
                response = yield zos_workflows_for_zowe_sdk_1.PropertiesWorkflow.getWorkflowProperties(this.mSession, workflowKey, undefined, requireSteps, this.arguments.listVariables);
                if (this.arguments.stepsSummaryOnly && response.steps) {
                    stepSummaries = yield zos_workflows_for_zowe_sdk_1.PropertiesWorkflow.processStepSummaries(response.steps);
                }
                else {
                    stepSummaries = response.steps;
                }
            }
            catch (err) {
                error = "List workflow details error: " + err;
                throw error;
            }
            params.response.data.setObj(response);
            if (!this.arguments.skipWorkflowSummary && !this.arguments.stepsSummaryOnly) {
                params.response.console.log("\nWorkflow Details: ");
                params.response.format.output({
                    fields: ["workflowName", "workflowKey",
                        response.automationStatus ? "automationStatus.messageText" : "automationStatus"],
                    output: response,
                    format: "object"
                });
            }
            if (response.steps) {
                params.response.console.log("\nWorkflow Steps: ");
                params.response.format.output({
                    fields: ["name", "state", "stepNumber",
                        this.arguments.stepsSummaryOnly ? "misc" : ""],
                    output: stepSummaries,
                    format: "table",
                    header: true
                });
            }
            if (this.arguments.listVariables && response.variables) {
                params.response.console.log("\nWorkflow Variables: ");
                params.response.format.output({
                    fields: ["name", "value", "type"],
                    output: response.variables,
                    format: "table",
                    header: true
                });
            }
        });
    }
}
exports.default = ActiveWorkflowDetails;
//# sourceMappingURL=ActiveWorkflowDetails.handler.js.map