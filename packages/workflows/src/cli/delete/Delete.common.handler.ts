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
import { DeleteWorkflow } from "../../api/Delete";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";


/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class DeleteCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof DeleteCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error;
        this.arguments = params.arguments;
        try{
            await DeleteWorkflow.deleteWorkflow(this.mSession, this.arguments.workflowKey);
        } catch (err){
            error = "Delete workflow: " + err;
            throw error;
        }
        params.response.data.setObj("Deleted.");
        params.response.console.log("Workflow deleted.");
    }
}
