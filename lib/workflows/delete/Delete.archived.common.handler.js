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
const minimatch = require("minimatch");
/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
class DeleteArchivedCommonHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteArchivedCommonHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let error;
            let listWorkflows;
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
                        yield zos_workflows_for_zowe_sdk_1.ArchivedDeleteWorkflow.archivedDeleteWorkflow(this.mSession, this.arguments.workflowKey);
                    }
                    catch (err) {
                        error = "Delete workflow: " + err;
                        throw error;
                    }
                    params.response.data.setObj("Deleted.");
                    params.response.console.log("Workflow deleted.");
                    break;
                case "workflowName": {
                    let wildCard = true;
                    let check;
                    let normalized;
                    const successWfs = [];
                    const failedWfs = [];
                    this.arguments.workflowName.includes(".*")
                        ? (normalized = this.arguments.workflowName
                            .split(".*")
                            .join("*"))
                        : (wildCard = false);
                    listWorkflows = yield zos_workflows_for_zowe_sdk_1.ListArchivedWorkflows.listArchivedWorkflows(this.mSession);
                    for (let i = listWorkflows.archivedWorkflows.length - 1; i >= 0; i--) {
                        // Swap between checks to avoid "glob pattern string required" error.
                        wildCard
                            ? (check = minimatch(listWorkflows.archivedWorkflows[i].workflowName, normalized))
                            : (check =
                                listWorkflows.archivedWorkflows[i]
                                    .workflowName ===
                                    this.arguments.workflowName);
                        if (check) {
                            try {
                                yield zos_workflows_for_zowe_sdk_1.ArchivedDeleteWorkflow.archivedDeleteWorkflow(this.mSession, listWorkflows.archivedWorkflows[i].workflowKey);
                                successWfs.push(listWorkflows.archivedWorkflows[i]);
                            }
                            catch (err) {
                                failedWfs.push(listWorkflows.archivedWorkflows[i]);
                            }
                        }
                        else {
                            listWorkflows.archivedWorkflows.splice(i, 1);
                        }
                    }
                    if (listWorkflows.archivedWorkflows.length === 0) {
                        throw new imperative_1.ImperativeError({
                            msg: `No workflows match the provided workflow name.`
                        });
                    }
                    if (listWorkflows.archivedWorkflows.length > 0) {
                        params.response.console.log("Successfully deleted workflow(s): ");
                        params.response.format.output({
                            fields: ["workflowName", "workflowKey"],
                            output: successWfs,
                            format: "table",
                            header: true
                        });
                    }
                    if (failedWfs.length > 0) {
                        params.response.console.log("\nFailed to delete Workflow(s): ");
                        params.response.format.output({
                            fields: ["workflowName", "workflowKey"],
                            output: failedWfs,
                            format: "table",
                            header: true
                        });
                        throw new imperative_1.ImperativeError({
                            msg: `Some workflows were not deleted, please check the message above.`
                        });
                    }
                    params.response.data.setObj("Deleted.");
                    break;
                }
                default:
                    throw new imperative_1.ImperativeError({
                        msg: `Internal create error: Unable to determine the the criteria by which to run delete workflow action. ` +
                            `Please contact support.`,
                        additionalDetails: JSON.stringify(params)
                    });
            }
        });
    }
}
exports.default = DeleteArchivedCommonHandler;
//# sourceMappingURL=Delete.archived.common.handler.js.map