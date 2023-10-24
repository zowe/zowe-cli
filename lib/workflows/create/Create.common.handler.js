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
 * Common Handler for creating workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */
class CreateCommonHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows create"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof CreateCommonHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            let sourceType;
            if (this.arguments.dataSet) {
                sourceType = "dataset";
            }
            else if (this.arguments.ussFile) {
                sourceType = "uss-file";
            }
            else if (this.arguments.localFile) {
                sourceType = "local-file";
            }
            let wfKey;
            let resp;
            let error;
            if (this.arguments.overwrite) {
                wfKey = yield zos_workflows_for_zowe_sdk_1.ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName);
                if (wfKey) {
                    try {
                        resp = yield zos_workflows_for_zowe_sdk_1.DeleteWorkflow.deleteWorkflow(this.mSession, wfKey);
                    }
                    catch (err) {
                        error =
                            "Deleting z/OSMF workflow with workflow name " +
                                this.arguments.workflowName +
                                " failed. More details: \n" +
                                err;
                    }
                }
            }
            switch (sourceType) {
                case "dataset":
                    try {
                        resp = yield zos_workflows_for_zowe_sdk_1.CreateWorkflow.createWorkflow(this.mSession, this.arguments.workflowName, this.arguments.dataSet, this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables, this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted);
                    }
                    catch (err) {
                        error =
                            "Creating zOS/MF workflow with data set: " +
                                this.arguments.dataSet +
                                " failed. More details: \n" +
                                err;
                        throw error;
                    }
                    params.response.data.setObj(resp);
                    params.response.format.output({
                        fields: ["workflowKey", "workflowDescription"],
                        output: resp,
                        format: "object"
                    });
                    break;
                case "uss-file":
                    try {
                        resp = yield zos_workflows_for_zowe_sdk_1.CreateWorkflow.createWorkflow(this.mSession, this.arguments.workflowName, this.arguments.ussFile, this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables, this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted);
                    }
                    catch (err) {
                        error =
                            "Creating z/OSMF workflow with uss file: " +
                                this.arguments.ussFile +
                                " failed. More details: \n" +
                                err;
                        throw error;
                    }
                    params.response.data.setObj(resp);
                    params.response.format.output({
                        fields: ["workflowKey", "workflowDescription"],
                        output: resp,
                        format: "object"
                    });
                    break;
                case "local-file":
                    try {
                        resp = yield zos_workflows_for_zowe_sdk_1.CreateWorkflow.createWorkflowLocal(this.mSession, this.arguments.workflowName, this.arguments.localFile, this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables, this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted, this.arguments.keepFiles, this.arguments.remoteDirectory);
                    }
                    catch (err) {
                        error =
                            "Creating z/OSMF workflow with local file: " +
                                this.arguments.localFile +
                                " failed. More details: \n" +
                                err;
                        throw error;
                    }
                    params.response.data.setObj(resp);
                    params.response.format.output({
                        fields: [
                            "workflowKey",
                            "workflowDescription",
                            resp.filesKept
                                ? "filesKept"
                                : resp.failedToDelete
                                    ? "failedToDelete"
                                    : ""
                        ],
                        output: resp,
                        format: "object"
                    });
                    break;
                default:
                    throw new imperative_1.ImperativeError({
                        msg: `Internal create error: Unable to determine the source of the definition file. ` +
                            `Please contact support.`,
                        additionalDetails: JSON.stringify(params)
                    });
            }
        });
    }
}
exports.default = CreateCommonHandler;
//# sourceMappingURL=Create.common.handler.js.map