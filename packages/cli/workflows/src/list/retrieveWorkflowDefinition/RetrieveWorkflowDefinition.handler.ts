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
import { DefinitionWorkflow } from "../../../../../../packages/workflows/src/Definition";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";
import { IWorkflowDefinition } from "../../../../../../packages/workflows/src/doc/IWorkflowDefinition";

/**
 * Common Handler for retrieving the contents of a z/OSMF workflow definition from a z/OS system.
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
        let response: IWorkflowDefinition;
        let error;
        const width = 42;
        try {
            response = await DefinitionWorkflow.getWorkflowDefinition(
                this.mSession, undefined, this.arguments.definitionFilePath,
                this.arguments.listSteps, this.arguments.listVariables);
        } catch (err) {
            error = "List workflow(s) " + err;
            throw error;
        }

        commandParameters.response.data.setObj(response);

        commandParameters.response.console.log("\nWorkflow Details: ");
        commandParameters.response.format.output({
            fields: ["workflowDefaultName", "workflowDescription", "workflowID"],
            output: response,
            format: "object"
        });

        if(this.arguments.listSteps && response.steps){
            commandParameters.response.console.log("\nWorkflow Steps: ");
            commandParameters.response.format.output({
                fields: ["name", "title", "description"],
                output: response.steps,
                format: "table",
                header: true
            });
        }

        if(this.arguments.listVariables && response.variables){
            commandParameters.response.console.log("\nWorkflow Variables: ");
            commandParameters.response.format.output({
                fields: ["name", "description", "type"],
                output: response.variables,
                format: "table",
                header: true
            });
        }
    }
}
