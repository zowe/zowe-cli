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
import { ArchiveWorkflow } from "../../api/ArchiveWorkflow";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHimport { noWorkflowName } from "../../api/WorkflowConstants";
andler";

/**
 * Common Handler for archiving workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */

export default class ArchiveHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof ArchiveHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows archive"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ArchiveHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        let sourceType: string;
        if (this.arguments.workflowKey) {
            sourceType = "workflowKey";
        } else if (this.arguments.workflowName) {
            sourceType = "workflowName";
        }

        let resp;
        let getWfKey;
        let error;

        switch (sourceType) {
            case "workflowKey":
                try{
                    resp = await ArchiveWorkflow.archiveWorfklowByKey(this.mSession, this.arguments.workflowKey, undefined);
                } catch (err){
                    error = "Archive workflow: " + err;
                    throw error;
                }
                params.response.data.setObj(resp);
                params.response.console.log("Workflow archived with workflow-key " + resp.workflowKey);
                break;

            case "workflowName":
                try{
                    getWfKey = await ListWorkflows.getWfKey(this.mSession, this.arguments.workflowName, undefined);
                    if (resp.noWorkflowName === null) {
                        throw new ImperativeError({
                            msg: `No workflows match the provided workflow name.`,
                            additionalDetails: JSON.stringify(params)
                        });
                    }
                    resp = await ArchiveWorkflow.archiveWorfklowByKey(this.mSession, getWfKey, undefined);
                } catch (err){
                    error = "Archive workflow: " + err;
                    throw error;
                }
                params.response.data.setObj(resp);
                params.response.console.log("Workflow archived with workflow-name " + resp.workflowName);
                break;

            default:
                throw new ImperativeError({
                    msg: `Internal archive error. Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
