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
import { IWorkflowsInfo } from "../../../api/doc/IWorkflowsInfo";
import { IArchivedWorkflows } from "../../../api/doc/IArchivedWorkflows";

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
        const width = 42;
        try {
            response = await ListArchivedWorkflows.listArchivedWorkflows(
                this.mSession, this.arguments.workflowKey, undefined);
        } catch (err) {
            error = "List workflow(s) " + err;
            throw error;
        }

        commandParameters.response.data.setObj(response);

        response.archivedWorkflows.forEach((workflow: IWorkflowsInfo) => {
        //    workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
        /*   if(workflow) {
                workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
            } else {
                console.error("Counting problems");
            }*/
          workflow.workflowDescription = TextUtils.wordWrap(`${workflow.workflowDescription}`, width);
        });

        // Format & print the response
        if (response.archivedWorkflows.length) {
            commandParameters.response.format.output({
                fields: ["workflowName", "workflowKey", "workflowDescription"],
                output: response.archivedWorkflows,
                format: "table",
                header: true,
            });
        } else {
            commandParameters.response.console.log("No workflows match the requested query");
        }
    }
}
