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
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
class WorkflowStepHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start workflow-step"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof WorkflowStepHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let error;
            let getWfKey;
            this.arguments = params.arguments;
            let sourceType;
            if (this.arguments.workflowKey) {
                sourceType = "workflowKey";
            }
            else if (this.arguments.workflowName) {
                sourceType = "workflowName";
            }
            switch (sourceType) {
                case "workflowKey":
                    try {
                        yield zos_workflows_for_zowe_sdk_1.StartWorkflow.startWorkflow(this.mSession, this.arguments.workflowKey, this.arguments.resolveConflict, this.arguments.stepName, this.arguments.performFollowingSteps);
                    }
                    catch (err) {
                        error = "Start workflow: " + err;
                        throw error;
                    }
                    params.response.data.setObj("Started.");
                    params.response.console.log("Workflow step started.");
                    break;
                case "workflowName":
                    try {
                        getWfKey = yield zos_workflows_for_zowe_sdk_1.ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
                        if (getWfKey === null) {
                            throw new imperative_1.ImperativeError({
                                msg: `No workflows match the provided workflow name.`,
                                additionalDetails: JSON.stringify(params)
                            });
                        }
                        yield zos_workflows_for_zowe_sdk_1.StartWorkflow.startWorkflow(this.mSession, getWfKey, this.arguments.resolveConflict, this.arguments.stepName, this.arguments.performFollowingSteps);
                    }
                    catch (err) {
                        error = "Start workflow: " + err;
                        throw error;
                    }
                    params.response.data.setObj("Started.");
                    params.response.console.log("Workflow step started.");
                    break;
                default:
                    throw new imperative_1.ImperativeError({
                        msg: `Internal create error: Unable to determine the the criteria by which to run start workflow action. ` +
                            `Please contact support.`,
                        additionalDetails: JSON.stringify(params)
                    });
            }
        });
    }
}
exports.default = WorkflowStepHandler;
//# sourceMappingURL=WorkflowStep.handler.js.map