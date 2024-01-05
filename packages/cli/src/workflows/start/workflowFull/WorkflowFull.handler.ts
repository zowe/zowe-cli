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
import { PropertiesWorkflow, StartWorkflow, ListWorkflows, IWorkflowInfo } from "@zowe/zos-workflows-for-zowe-sdk";


/**
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class WorkflowFullHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof WorkflowFullHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start full-workflow
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof WorkflowFullHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error;
        this.arguments = params.arguments;
        let workflowKey: string;

        if (this.arguments.workflowKey) {
            workflowKey = this.arguments.workflowKey;
        } else if (this.arguments.workflowName) {
            workflowKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
            if(!workflowKey) {
                throw new ImperativeError({
                    msg: `No workflows match the provided workflow name.`
                });
            }
        }

        try{
            await StartWorkflow.startWorkflow(this.mSession, workflowKey, this.arguments.resolveConflict);
        } catch (err) {
            error = new ImperativeError({
                msg: "Start workflow: " + err,
                causeErrors: err
            });
            throw error;
        }

        if (this.arguments.wait){
            let response: IWorkflowInfo;
            let workflowComplete = false;
            while(!workflowComplete) {
                response = await PropertiesWorkflow.getWorkflowProperties(this.mSession, workflowKey);
                if (response.automationStatus && response.statusName !== "automation-in-progress") {
                    workflowComplete = true;
                    if (response.statusName === "complete") {
                        params.response.data.setObj("Complete.");
                        params.response.console.log("Workflow completed successfully.");
                    } else {
                        throw new ImperativeError({
                            msg: `Workflow failed or was cancelled or there is manual step.`,
                            additionalDetails: JSON.stringify(response)
                        });
                    }
                }
            }
        } else {
            params.response.data.setObj("Started.");
            params.response.console.log("Workflow started.");
        }
    }
}
