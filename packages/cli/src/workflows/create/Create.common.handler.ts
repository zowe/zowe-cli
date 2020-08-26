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

import { IHandlerParameters, ImperativeError, Imperative } from "@zowe/imperative";
import { CreateWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";
import { ZosmfBaseHandler } from "../../../src/provisioning/delete/instance/node_modules/@zowe/zosmf-for-zowe-sdk";
import { ListWorkflows, DeleteWorkflow } from "../../../..";

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
        } else if (this.arguments.localFile) {
            sourceType = "local-file";
        }

        let wfKey: string;
        let resp;
        let error;
        if (this.arguments.overwrite) {
            wfKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName);
            if (wfKey) {
                try{
                    resp = await DeleteWorkflow.deleteWorkflow(this.mSession, wfKey);
                } catch (err) {
                    error = "Deleting z/OSMF workflow with workflow name " + this.arguments.workflowName + " failed. More details: \n" + err;
                }
            }
        }
        switch (sourceType) {
            case "dataset":
                try{
                    resp = await CreateWorkflow.createWorkflow(this.mSession, this.arguments.workflowName, this.arguments.dataSet,
                        this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables,
                        this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted);
                } catch (err){
                    error = "Creating zOS/MF workflow with data set: " + this.arguments.dataSet + " failed. More details: \n" + err;
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
                    error = "Creating z/OSMF workflow with uss file: " + this.arguments.ussFile + " failed. More details: \n" + err;
                    throw error;
                }
                params.response.data.setObj(resp);

                params.response.format.output({
                    fields: ["workflowKey", "workflowDescription"],
                    output: resp,
                    format: "object"
                });

                break;

            case "local-file":
                try{
                    resp = await CreateWorkflow.createWorkflowLocal(this.mSession, this.arguments.workflowName, this.arguments.localFile,
                        this.arguments.systemName, this.arguments.owner, this.arguments.variablesInputFile, this.arguments.variables,
                        this.arguments.assignToOwner, this.arguments.accessType, this.arguments.deleteCompleted,
                        this.arguments.keepFiles, this.arguments.remoteDirectory);
                } catch (err){
                    error = "Creating z/OSMF workflow with local file: " + this.arguments.localFile + " failed. More details: \n" + err;
                    throw error;
                }
                params.response.data.setObj(resp);

                params.response.format.output({
                    fields: ["workflowKey", "workflowDescription",
                            resp.filesKept ? "filesKept" : resp.failedToDelete ? "failedToDelete" : ""],
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
