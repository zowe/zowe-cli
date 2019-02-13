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
import { ListWorkflows } from "../../../api/ListWorkflows";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Common Handler for creating workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */

export default class ListWorkflowHandler extends ZosmfBaseHandler {
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
        let response;
        let error;
        try {
            response = await ListWorkflows.listWorkflows(
                this.mSession, undefined, this.arguments.workflowName,
                this.arguments.category, this.arguments.system, this.arguments.owner,
                this.arguments.vendor, this.arguments.statusName);
        } catch (err) {
            error = "List workflow(s) " + err;
            throw error;
        }

        commandParameters.response.data.setObj(response);
        // tslint:disable-next-line:no-console
        console.log(response);
        commandParameters.response.console.log("List of workflows matching the search query " + response.toString())
        ;
    }
}
