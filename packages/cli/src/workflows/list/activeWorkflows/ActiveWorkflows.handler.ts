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

import { IHandlerParameters, TextUtils } from "@zowe/imperative";
import { IWorkflowsInfo, ListWorkflows, IActiveWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Common Handler for listing active workflow(s) instance(s) in z/OSMF.
 */

export default class ListActiveWorkflowsHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof ListHandler
     */
    private arguments: any;

    /**
     * Handler process - invoked by the command processor to handle the "zos-workflows list"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ListHandler
     */
    public async processCmd(commandParameters: IHandlerParameters): Promise<void> {
        this.arguments = commandParameters.arguments;
        let response: IActiveWorkflows;
        let error;
        const width = 42;
        try {
            response = await ListWorkflows.getWorkflows(this.mSession, {
                workflowName: this.arguments.workflowName,
                category: this.arguments.category,
                system: this.arguments.system,
                owner: this.arguments.owner,
                vendor: this.arguments.vendor,
                statusName: this.arguments.statusName
            });
        } catch (err) {
            error = "List workflow(s) " + err;
            throw error;
        }

        commandParameters.response.data.setObj(response);

        response.workflows.forEach((workflow: IWorkflowsInfo) => {
            workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
            workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
            workflow.workflowDescription = TextUtils.wordWrap(`${workflow.workflowDescription}`, width);
        });

        // Format & print the response
        if (response.workflows.length) {
            commandParameters.response.format.output({
                fields: ["workflowName", "workflowKey", "workflowDescription"],
                output: response.workflows,
                format: "table",
                header: true
            });
        } else {
            commandParameters.response.console.log("No workflows match the requested querry");
        }
    }
}
