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

import { IHandlerParameters } from "@brightside/imperative";
import { StartWorkflow } from "../../api/Start";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";
import { isNullOrUndefined } from "util";
import { PropertiesWorkflow } from "../../..";
import { IWorkflowInfo } from "../../api/doc/IWorkflowInfo";


/**
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class StartCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof StartCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof StartCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error;
        this.arguments = params.arguments;
        // TODO after list is done: if workflow name is passed, get key
        if (isNullOrUndefined(this.arguments.performOneStep)) {
            this.arguments.performOneStep = false;
        }
        try{
            await StartWorkflow.startWorkflow(this.mSession, this.arguments.workflowKey, this.arguments.resolveConflict,
                this.arguments.stepName, !this.arguments.performOneStep);
        } catch (err){
            error = "Start workflow: " + err;
            throw error;
        }
        if (this.arguments.wait){
            let response: IWorkflowInfo;
            let flag = false;
            while(!flag) {
                if (!isNullOrUndefined(params.arguments.stepName)) {
                    params.response.data.setObj("Started.");
                    params.response.console.log("Workflow started.");
                    flag = true;
                }
                else {
                    response = await PropertiesWorkflow.getWorkflowProperties(this.mSession, this.arguments.workflowKey);
                    if (response.automationStatus && response.statusName !== "automation-in-progress") {
                            if (response.statusName === "complete") {
                                params.response.data.setObj("Complete.");
                                params.response.console.log("Workflow completed successfully.");
                                flag = true;
                            }
                            else {
                                params.response.data.setObj("Fail.");
                                params.response.console.log("Workflow failed or was cancelled.");
                                flag = true;
                            }
                    }
                }
            }
        } else {
            params.response.data.setObj("Started.");
            params.response.console.log("Workflow started.");
        }
    }
}
