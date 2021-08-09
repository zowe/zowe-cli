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
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
import { ArchiveWorkflow, ListWorkflows, IWorkflowsInfo, IActiveWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

/**
 * Common Handler for archiving workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */

export default class ArchiveHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof ArchiveHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows archive"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ArchiveHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        let sourceType: string;
        if (this.arguments.workflowKey) {
            sourceType = "workflowKey";
        } else if (this.arguments.workflowName) {
            sourceType = "workflowName";
        }

        let resp;
        let getWfKey: IActiveWorkflows;
        let error;

        switch (sourceType) {
            case "workflowKey":
                try{
                    resp = await ArchiveWorkflow.archiveWorkflowByKey(this.mSession, this.arguments.workflowKey, undefined);
                } catch (err){
                    error = "Archive workflow: " + err;
                    throw error;
                }
                params.response.data.setObj(resp);
                params.response.console.log("Workflow archived with workflow-key " + resp.workflowKey);
                break;

            case "workflowName": {
                getWfKey = await ListWorkflows.getWorkflows(this.mSession, {workflowName: this.arguments.workflowName});
                if (getWfKey === null || getWfKey.workflows.length === 0) {
                    throw new ImperativeError({
                        msg: `No workflows match the provided workflow name.`
                    });
                }
                const successWfs: IWorkflowsInfo[] = [];
                const failedWfs: IWorkflowsInfo[] = [];
                for(const element of getWfKey.workflows){
                    try {
                        resp = await ArchiveWorkflow.archiveWorkflowByKey(this.mSession, element.workflowKey);
                        successWfs.push(element);
                    } catch (err) {
                        failedWfs.push(element);
                    }
                }

                params.response.data.setObj("Archived.");

                if(getWfKey.workflows.length > 0){
                    params.response.console.log("Successfully archived workflow(s): ");
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: successWfs,
                        format: "table",
                        header: true
                    });
                }

                if(failedWfs.length > 0){
                    params.response.console.log("\nFailed to archive Workflow(s): ");
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: failedWfs,
                        format: "table",
                        header: true
                    });
                    throw new ImperativeError({
                        msg: `Some workflows were not archived, please check the message above.`
                    });
                }
                break;
            }
            default:
                throw new ImperativeError({
                    msg: `Internal create error: Unable to determine the the criteria by which to run workflow archive action. ` +
                    `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
