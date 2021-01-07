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
import { ListWorkflows, IWorkflowInfo, IStepSummary, PropertiesWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";

/**
 * A Handler for listing details of a workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */

export default class ActiveWorkflowDetails extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof PropertiesCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows list active-workflow-details"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof PropertiesCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        let workflowKey: string;
        let response: IWorkflowInfo;
        let requireSteps: boolean;
        let stepSummaries: IStepSummary[] = [];
        let error: any;

        if (this.arguments.workflowKey) {
            workflowKey = this.arguments.workflowKey;
        } else if (this.arguments.workflowName) {
            workflowKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
            if(!workflowKey) {
                throw new ImperativeError({
                    msg: `No workflows match the provided workflow name.`,
                    additionalDetails: JSON.stringify(params)
                });
            }
        }

        this.arguments.listSteps || this.arguments.stepsSummaryOnly ? requireSteps = true : requireSteps = false;

        try {
            response = await PropertiesWorkflow.getWorkflowProperties(this.mSession, workflowKey, undefined,
                                                                      requireSteps, this.arguments.listVariables);
            if(this.arguments.stepsSummaryOnly && response.steps) {
                stepSummaries = await PropertiesWorkflow.processStepSummaries(response.steps);
            } else {
                stepSummaries = response.steps;
            }
        } catch(err){
            error = "List workflow details error: " + err;
            throw error;
        }
        params.response.data.setObj(response);

        if (!this.arguments.skipWorkflowSummary && !this.arguments.stepsSummaryOnly) {
            params.response.console.log("\nWorkflow Details: ");
            params.response.format.output({
                fields: ["workflowName", "workflowKey",
                        response.automationStatus? "automationStatus.messageText" : "automationStatus"],
                output: response,
                format: "object"
            });
        }

        if(response.steps){
            params.response.console.log("\nWorkflow Steps: ");
            params.response.format.output({
                fields: ["name", "state", "stepNumber",
                        this.arguments.stepsSummaryOnly ? "misc" : ""],
                output: stepSummaries,
                format: "table",
                header: true
            });
        }

        if(this.arguments.listVariables && response.variables){
            params.response.console.log("\nWorkflow Variables: ");
            params.response.format.output({
                fields: ["name", "value", "type"],
                output: response.variables,
                format: "table",
                header: true
            });
        }
    }
}
