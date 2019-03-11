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

import { IHandlerParameters } from "@zowe/imperative";
import { StartWorkflow } from "../../../../";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";


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
        this.arguments = params.arguments;
        // TODO after list is done: if workflow name is passed, get key
        try{
            await StartWorkflow.startWorkflow(this.mSession, this.arguments.workflowKey, this.arguments.resolveConflict,
                this.arguments.stepName, this.arguments.performFollowingSteps);
        } catch (err){
            error = "Start workflow: " + err;
            throw error;
        }
        params.response.data.setObj("Started.");
        params.response.console.log("Workflow step started.");
    }
}
