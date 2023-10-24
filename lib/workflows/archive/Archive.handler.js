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
 * Common Handler for archiving workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */
class ArchiveHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows archive"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ArchiveHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            let sourceType;
            if (this.arguments.workflowKey) {
                sourceType = "workflowKey";
            }
            else if (this.arguments.workflowName) {
                sourceType = "workflowName";
            }
            let resp;
            let getWfKey;
            let error;
            switch (sourceType) {
                case "workflowKey":
                    try {
                        resp = yield zos_workflows_for_zowe_sdk_1.ArchiveWorkflow.archiveWorkflowByKey(this.mSession, this.arguments.workflowKey, undefined);
                    }
                    catch (err) {
                        error = "Archive workflow: " + err;
                        throw error;
                    }
                    params.response.data.setObj(resp);
                    params.response.console.log("Workflow archived with workflow-key " + resp.workflowKey);
                    break;
                case "workflowName": {
                    getWfKey = yield zos_workflows_for_zowe_sdk_1.ListWorkflows.getWorkflows(this.mSession, { workflowName: this.arguments.workflowName });
                    if (getWfKey === null || getWfKey.workflows.length === 0) {
                        throw new imperative_1.ImperativeError({
                            msg: `No workflows match the provided workflow name.`
                        });
                    }
                    const successWfs = [];
                    const failedWfs = [];
                    for (const element of getWfKey.workflows) {
                        try {
                            resp = yield zos_workflows_for_zowe_sdk_1.ArchiveWorkflow.archiveWorkflowByKey(this.mSession, element.workflowKey);
                            successWfs.push(element);
                        }
                        catch (err) {
                            failedWfs.push(element);
                        }
                    }
                    params.response.data.setObj("Archived.");
                    if (getWfKey.workflows.length > 0) {
                        params.response.console.log("Successfully archived workflow(s): ");
                        params.response.format.output({
                            fields: ["workflowName", "workflowKey"],
                            output: successWfs,
                            format: "table",
                            header: true
                        });
                    }
                    if (failedWfs.length > 0) {
                        params.response.console.log("\nFailed to archive Workflow(s): ");
                        params.response.format.output({
                            fields: ["workflowName", "workflowKey"],
                            output: failedWfs,
                            format: "table",
                            header: true
                        });
                        throw new imperative_1.ImperativeError({
                            msg: `Some workflows were not archived, please check the message above.`
                        });
                    }
                    break;
                }
                default:
                    throw new imperative_1.ImperativeError({
                        msg: `Internal create error: Unable to determine the the criteria by which to run workflow archive action. ` +
                            `Please contact support.`,
                        additionalDetails: JSON.stringify(params)
                    });
            }
        });
    }
}
exports.default = ArchiveHandler;
//# sourceMappingURL=Archive.handler.js.map