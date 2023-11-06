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

import { IHandlerParameters, ImperativeError } from "@zowe/core-for-zowe-sdk";
import {
    IArchivedWorkflows,
    IWorkflowsInfo,
    ListArchivedWorkflows,
    ArchivedDeleteWorkflow
} from "@zowe/zos-workflows-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
const minimatch = require("minimatch");

/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class DeleteArchivedCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof DeleteArchivedCommonHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteArchivedCommonHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        let error: string;
        let listWorkflows: IArchivedWorkflows;
        this.arguments = params.arguments;

        let sourceType: string;
        if (this.arguments.workflowKey) {
            sourceType = "workflowKey";
        } else if (this.arguments.workflowName) {
            sourceType = "workflowName";
        }

        switch (sourceType) {
            case "workflowKey":
                try {
                    await ArchivedDeleteWorkflow.archivedDeleteWorkflow(
                        this.mSession,
                        this.arguments.workflowKey
                    );
                } catch (err) {
                    error = "Delete workflow: " + err;
                    throw error;
                }
                params.response.data.setObj("Deleted.");
                params.response.console.log("Workflow deleted.");
                break;

            case "workflowName": {
                let wildCard: boolean = true;
                let check: boolean;
                let normalized: string;
                const successWfs: IWorkflowsInfo[] = [];
                const failedWfs: IWorkflowsInfo[] = [];
                this.arguments.workflowName.includes(".*")
                    ? (normalized = this.arguments.workflowName
                        .split(".*")
                        .join("*"))
                    : (wildCard = false);

                listWorkflows = await ListArchivedWorkflows.listArchivedWorkflows(
                    this.mSession
                );

                for (
                    let i = listWorkflows.archivedWorkflows.length - 1;
                    i >= 0;
                    i--
                ) {
                // Swap between checks to avoid "glob pattern string required" error.
                    wildCard
                        ? (check = minimatch(
                            listWorkflows.archivedWorkflows[i].workflowName,
                            normalized
                        ))
                        : (check =
                              listWorkflows.archivedWorkflows[i]
                                  .workflowName ===
                              this.arguments.workflowName);

                    if (check) {
                        try {
                            await ArchivedDeleteWorkflow.archivedDeleteWorkflow(
                                this.mSession,
                                listWorkflows.archivedWorkflows[i].workflowKey
                            );
                            successWfs.push(listWorkflows.archivedWorkflows[i]);
                        } catch (err) {
                            failedWfs.push(listWorkflows.archivedWorkflows[i]);
                        }
                    } else {
                        listWorkflows.archivedWorkflows.splice(i, 1);
                    }
                }

                if (listWorkflows.archivedWorkflows.length === 0) {
                    throw new ImperativeError({
                        msg: `No workflows match the provided workflow name.`
                    });
                }

                if (listWorkflows.archivedWorkflows.length > 0) {
                    params.response.console.log(
                        "Successfully deleted workflow(s): "
                    );
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: successWfs,
                        format: "table",
                        header: true
                    });
                }

                if (failedWfs.length > 0) {
                    params.response.console.log(
                        "\nFailed to delete Workflow(s): "
                    );
                    params.response.format.output({
                        fields: ["workflowName", "workflowKey"],
                        output: failedWfs,
                        format: "table",
                        header: true
                    });
                    throw new ImperativeError({
                        msg: `Some workflows were not deleted, please check the message above.`
                    });
                }
                params.response.data.setObj("Deleted.");
                break;
            }
            default:
                throw new ImperativeError({
                    msg:
                        `Internal create error: Unable to determine the the criteria by which to run delete workflow action. ` +
                        `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }
    }
}
