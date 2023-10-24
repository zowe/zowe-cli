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
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
class WorkflowFullHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start full-workflow
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof WorkflowFullHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let error;
            this.arguments = params.arguments;
            let workflowKey;
            if (this.arguments.workflowKey) {
                workflowKey = this.arguments.workflowKey;
            }
            else if (this.arguments.workflowName) {
                workflowKey = yield zos_workflows_for_zowe_sdk_1.ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
                if (!workflowKey) {
                    throw new imperative_1.ImperativeError({
                        msg: `No workflows match the provided workflow name.`
                    });
                }
            }
            try {
                yield zos_workflows_for_zowe_sdk_1.StartWorkflow.startWorkflow(this.mSession, workflowKey, this.arguments.resolveConflict);
            }
            catch (err) {
                error = "Start workflow: " + err;
                throw error;
            }
            if (this.arguments.wait) {
                let response;
                let workflowComplete = false;
                while (!workflowComplete) {
                    response = yield zos_workflows_for_zowe_sdk_1.PropertiesWorkflow.getWorkflowProperties(this.mSession, workflowKey);
                    if (response.automationStatus && response.statusName !== "automation-in-progress") {
                        workflowComplete = true;
                        if (response.statusName === "complete") {
                            params.response.data.setObj("Complete.");
                            params.response.console.log("Workflow completed successfully.");
                        }
                        else {
                            throw new imperative_1.ImperativeError({
                                msg: `Workflow failed or was cancelled or there is manual step.`,
                                additionalDetails: JSON.stringify(response)
                            });
                        }
                    }
                }
            }
            else {
                params.response.data.setObj("Started.");
                params.response.console.log("Workflow started.");
            }
        });
    }
}
exports.default = WorkflowFullHandler;
//# sourceMappingURL=WorkflowFull.handler.js.map