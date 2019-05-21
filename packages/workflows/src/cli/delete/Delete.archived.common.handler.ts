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

import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import { ArchivedDeleteWorkflow } from "../../api/ArchivedDelete";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";
import { ListArchivedWorkflows } from "../../api/ListArchivedWorkflows";
import { IArchivedWorkflows } from "../../../src/api/doc/IArchivedWorkflows";
import { WorkflowConstants, nozOSMFVersion, wrongString, noWorkflowName } from "../../../src/api/WorkflowConstants";
import { IWorkflowsInfo } from "../../api/doc/IWorkflowsInfo";

/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class DeleteArchivedCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof DeleteArchivedCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteArchivedCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error: string;
        let resp: string;
        let getWfKey: IArchivedWorkflows;
        this.arguments = params.arguments;

        let sourceType: string;
        if (this.arguments.workflowKey) {
            sourceType = "workflowKey";
        } else if (this.arguments.workflowName) {
            sourceType = "workflowName";
        }

        switch (sourceType) {
            case "workflowKey":
                try{
                    await ArchivedDeleteWorkflow.archivedDeleteWorkflow(this.mSession, this.arguments.workflowKey);
                } catch (err){
                    error = "Delete workflow: " + err;
                    throw error;
                }
                params.response.data.setObj("Deleted.");
                params.response.console.log("Workflow deleted.");
                break;

            case "workflowName":
                try{
                    getWfKey = await ListArchivedWorkflows.listArchivedWorkflows(this.mSession);
                    await getWfKey.archivedWorkflows.forEach((archivedWorkflow: IWorkflowsInfo) => {
                        if (archivedWorkflow.workflowName === this.arguments.workflowName) {
                            this.arguments.workflowKey =  archivedWorkflow.workflowKey;
                        }
                    });
                    if (!this.arguments.workflowKey) {
                        throw new ImperativeError({
                            msg: `No workflows match the provided workflow name.`,
                            additionalDetails: JSON.stringify(params)
                        });
                    }
                    resp = await ArchivedDeleteWorkflow.archivedDeleteWorkflow(this.mSession, this.arguments.workflowKey);
                } catch (err){
                    error = "Delete workflow: " + err;
                    throw error;
                }
                params.response.data.setObj("Deleted.");
                params.response.console.log("Workflow deleted.");
                break;

            default:
            throw new ImperativeError({
                msg: `Internal create error: Unable to determine the the criteria by which to run delete workflow action. ` +
                    `Please contact support.`,
                additionalDetails: JSON.stringify(params)
                });
        }
    }
}
