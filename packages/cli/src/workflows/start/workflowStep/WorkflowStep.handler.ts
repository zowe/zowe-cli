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
import { StartWorkflow, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class WorkflowStepHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof WorkflowStepHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start workflow-step"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof WorkflowStepHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error;
        let getWfKey;
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
                    await StartWorkflow.startWorkflow(this.mSession, this.arguments.workflowKey, this.arguments.resolveConflict,
                        this.arguments.stepName, this.arguments.performFollowingSteps);
                } catch (err){
                    error = new ImperativeError({
                        msg: "Start workflow: " + err,
                        causeErrors: err.causeErrors,
                        additionalDetails: err.additionalDetails
                    });
                    throw error;
                }
                params.response.data.setObj("Started.");
                params.response.console.log("Workflow step started.");
                break;
            case "workflowName":
                try{
                    getWfKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
                    if (getWfKey === null) {
                        throw new ImperativeError({
                            msg: `No workflows match the provided workflow name.`,
                            additionalDetails: JSON.stringify(params)
                        });
                    }
                    await StartWorkflow.startWorkflow(this.mSession, getWfKey, this.arguments.resolveConflict,
                        this.arguments.stepName, this.arguments.performFollowingSteps);
                } catch (err){
                    error = new ImperativeError({
                        msg: "Start workflow Error: " + err,
                        causeErrors: err.causeErrors,
                        additionalDetails: err.additionalDetails
                    });
                    throw error;
                }
                params.response.data.setObj("Started.");
                params.response.console.log("Workflow step started.");
                break;
            default:
                throw new ImperativeError({
                    msg: `Internal create error: Unable to determine the the criteria by which to run start workflow action. ` +
                    `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
