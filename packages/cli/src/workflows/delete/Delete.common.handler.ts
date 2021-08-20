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
import { ListWorkflows, IActiveWorkflows, IWorkflowsInfo, DeleteWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class DeleteCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof DeleteCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error;
        let getWfKey: IActiveWorkflows;
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
                    await DeleteWorkflow.deleteWorkflow(this.mSession, this.arguments.workflowKey);
                } catch (err){
                    error = "Delete workflow: " + err;
                    throw error;
                }
                params.response.data.setObj("Deleted.");
                params.response.console.log("Workflow deleted.");
                break;

            case "workflowName": {
                getWfKey = await ListWorkflows.getWorkflows(this.mSession, {workflowName: this.arguments.workflowName});
                if (getWfKey === null || getWfKey.workflows.length === 0) {
                    throw new ImperativeError({
                        msg: `No workflows match the provided workflow name.`,
                        additionalDetails: JSON.stringify(params)
                    });
                }
                const successWfs: IWorkflowsInfo[] = [];
                const failedWfs: IWorkflowsInfo[] = [];
                for(const element of getWfKey.workflows){
                    try {
                        await DeleteWorkflow.deleteWorkflow(this.mSession, element.workflowKey);
                        successWfs.push(element);
                    } catch (err) {
                        failedWfs.push(element);
                    }
                }

                params.response.data.setObj("Deleted.");

                if(getWfKey.workflows.length > 0){
                    params.response.console.log("Successfully deleted workflow(s): ");
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: successWfs,
                        format: "table",
                        header: true
                    });
                }

                if(failedWfs.length > 0){
                    params.response.console.log("\nFailed to delete Workflow(s): ");
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: failedWfs,
                        format: "table",
                        header: true
                    });
                    throw new ImperativeError({
                        msg: `Some workflows were not deleted, please check the message above.`
                    });
                }

                break;
            }
            default:
                throw new ImperativeError({
                    msg: `Internal create error: Unable to determine the the criteria by which to run delete workflow action. ` +
                    `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
