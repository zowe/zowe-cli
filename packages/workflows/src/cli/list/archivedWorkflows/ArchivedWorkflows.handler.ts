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

import { IHandlerParameters, TextUtils } from "@brightside/imperative";
import { ListArchivedWorkflows } from "../../../api/ListArchivedWorkflows";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";
import { IArchivedWorkflows } from "../../../api/doc/IArchivedWorkflows";
import { IWorkflowsInfo } from "../../../api/doc/IWorkflowsInfo";

/**
 * Common Handler for listing archived workflows for a system.
 */

export default class ListArchivedWorkflowsHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof ListArchivedWorkflowsHandler
     */
    private arguments: any;

    /**
     * Handler process - invoked by the command processor to handle the "zos-workflows archived list"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ListArchivedWorkflowsHandler
     */
    public async processCmd(commandParameters: IHandlerParameters): Promise<void> {
        this.arguments = commandParameters.arguments;
        let response: IArchivedWorkflows;
        let error;
      //  let workflowKey: string;
        const width = 42;
        try {
        response = await ListArchivedWorkflows.listArchivedWorkflows(
            this.mSession, undefined, this.arguments.workflowKey);
          } catch (err) {
        error = "List workflow(s) " + err;
        throw error;
        }
        commandParameters.response.data.setObj(response);

        response.archivedWorkflows.forEach((workflow: IWorkflowsInfo) => {
         //   workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
            workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
        });

        // Format & print the response
        if (response.archivedWorkflows.length) {
            commandParameters.response.format.output({
                fields: ["workflowName", "workflowKey"],
                output: response.archivedWorkflows,
                format: "table",
                header: true,
            });
        } else {
            commandParameters.response.console.log("No workflows match the requested query");
        }
    }
}

        /*
        try {
            response = await ListArchivedWorkflows.listArchivedWorkflows(
                this.mSession, undefined, this.arguments.workflowName, this.arguments.owner);
        } catch (err) {
            error = "List workflow(s) " + err;
            throw error;
        }

        let orderBy: string;
        if (this.arguments.asc) {
            orderBy = "asc";
        } else  {
            orderBy = "desc";
        }

        switch (orderBy){
            case "asc":
            try {
                response = await ListArchivedWorkflows.listArchivedWorkflows(
                    this.mSession, undefined, this.arguments.workflowName, this.arguments.owner);
            } catch (err) {
                error = "List workflow(s) " + err;
                throw error;
            }
            commandParameters.response.data.setObj(response);
            response.archivedWorkflows.forEach((workflow: IWorkflowsInfo) => {
                workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
                workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
                workflow.archivedInstanceURI = TextUtils.wordWrap(`${workflow.archivedInstanceURI}`, width);
            });
            // Format & print the response
            if (response.archivedWorkflows.length) {
                commandParameters.response.format.output({
                    fields: ["workflowName", "workflowKey", "archivedInstanceURI"],
                    output: response.archivedWorkflows,
                    format: "table",
                    header: true,
                });
                }

            break;

            case "desc":
            try {
                response = await ListArchivedWorkflows.listArchivedWorkflows(
                    this.mSession, undefined, this.arguments.workflowName, this.arguments.owner);
            } catch (err) {
                error = "List workflow(s) " + err;
                throw error;
            }
            commandParameters.response.data.setObj(response);
            response.archivedWorkflows.forEach((workflow: IWorkflowsInfo) => {
                workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
                workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
                workflow.archivedInstanceURI = TextUtils.wordWrap(`${workflow.archivedInstanceURI}`, width);
            });
            // Format & print the response
            if (response.archivedWorkflows.length) {
                commandParameters.response.format.output({
                    fields: ["workflowName", "workflowKey", "archivedInstanceURI"],
                    output: response.archivedWorkflows,
                    format: "table",
                    header: true,
                });

                break;
            } else {
        commandParameters.response.console.log("No workflows match the requested query");
                }
        }
    }
 }
       ----start

        if (this.arguments.workflowKey) {
            workflowKey = this.arguments.workflowKey;
        } else if (this.arguments.workflowName) {
            workflowKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
            if(!workflowKey) {
                throw new ImperativeError({
                    msg: `No workflows match the provided workflow name.`,
                });
            }
        }

        try{
            await StartWorkflow.startWorkflow(this.mSession, workflowKey, this.arguments.resolveConflict);
        } catch (err) {
            error = "Start workflow: " + err;
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
*/
