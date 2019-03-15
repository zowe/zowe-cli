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
import { CreateWorkflow } from "../../api/Create";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Common Handler for creating workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */

export default class CreateCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof CreateCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows create"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof CreateCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        let sourceType: string;
        if (this.arguments.dataSet) {
            sourceType = "dataset";
        } else if (this.arguments.ussFile) {
            sourceType = "uss-file";
        }

        let resp;
        let error;

        switch (sourceType) {
            case "dataset":
                try{
                    resp = await CreateWorkflow.createWorkflow(this.mSession, this.arguments.workflowName, this.arguments.dataSet,
                        this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables,
                        this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted);
                } catch (err){
                    error = "Creating zOS/MF workflow instance with data set: " + this.arguments.dataSet + " failed. More details: \n" + err;
                    throw error;
                }
                params.response.data.setObj(resp);

                params.response.format.output({
                    fields: ["workflowKey", "workflowDescription"],
                    output: resp,
                    format: "object"
                });

                break;

            case "uss-file":
                try{
                    resp = await CreateWorkflow.createWorkflow(this.mSession, this.arguments.workflowName, this.arguments.ussFile,
                        this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables,
                        this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted);
                } catch (err){
                    error = "Creating zOS/MF workflow instance with uss file: " + this.arguments.ussFile + " failed. More details: \n" + err;
                    throw error;
                }
                params.response.data.setObj(resp);

                params.response.format.output({
                    fields: ["workflowKey", "workflowDescription"],
                    output: resp,
                    format: "object"
                });

                break;

            default:
                throw new ImperativeError({
                    msg: `Internal create error: Unable to determine the source of the definition file. ` +
                        `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
