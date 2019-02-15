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

import { IHandlerParameters, ImperativeError } from "@brightside/imperative";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";
import { PropertiesWorkflow } from "../../../api/Properties";

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

        let sourceType: string;
        if (this.arguments.byWorkflowKey) {
            sourceType = "workfowKey";
        }
        // else if (this.arguments.byName) {
        //     sourceType = "workfowName";
        // }

        let resp;
        let error;

        switch (sourceType) {
            case "workfowKey":

                try{
                    resp = await PropertiesWorkflow.getWorkflowProperties(this.mSession, this.arguments.byWorkflowKey,
                                                                             undefined, this.arguments.listSteps, this.arguments.listVariables);
                } catch (err){
                    error = "List workflow details error: " + err;
                    throw error;
                }
                params.response.data.setObj(resp);

                params.response.console.log("\nWorkflow Details: ");
                params.response.format.output({
                    fields: ["workflowName", "workflowKey",
                        resp.automationStatus? "automationStatus.messageText" : "automationStatus"],
                    output: resp,
                    format: "object",
                });

                if(this.arguments.listSteps && resp.steps){
                    params.response.console.log("\nWorkflow Steps: ");
                    params.response.format.output({
                        fields: ["name", "state", "stepNumber"],
                        output: resp.steps,
                        format: "table",
                        header: true
                    });
                }

                if(this.arguments.listVariables && resp.variables){
                    params.response.console.log("\nWorkflow Variables: ");
                    params.response.format.output({
                        fields: ["name", "value", "type"],
                        output: resp.variables,
                        format: "table",
                        header: true
                    });
                }
                break;

            // TO DO:
            // case "workfowName":
            //     break;

            default:
                throw new ImperativeError({
                    msg: `Internal create error: Unable to determine the the criteria by which to list workflow details. ` +
                        `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
