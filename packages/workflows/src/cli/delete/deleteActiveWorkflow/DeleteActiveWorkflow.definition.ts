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

import { ICommandDefinition, ICommandOptionDefinition } from "@brightside/imperative";
import { join } from "path";
import { DeleteWorkflowOptions } from "../deleteActiveWorkflow/DeleteActiveWorkflow.options";


/**
 * This object defines the command for delete workflow using workflow key within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const DeleteActiveWorkflow: ICommandDefinition = {
    name: "active-workflow",
    aliases: ["aw"],
    description: "Delete an active workflow instance in z/OSMF",
    type: "command",
    handler: join(__dirname, "../Delete.common.handler"),
    profile: {
        optional: ["zosmf"],
    },
    options: ([
        DeleteWorkflowOptions.workflowKey
    ]),
    examples: [
        {
            description: "To delete a workflow instance in z/OSMF with workflow key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\"",
            options: "--workflow-key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\""
        }
    ],
};
