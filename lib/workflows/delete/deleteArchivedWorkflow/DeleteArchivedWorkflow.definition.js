"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteArchivedWorkflow = void 0;
const path_1 = require("path");
const DeleteArchivedWorkflow_options_1 = require("../deleteArchivedWorkflow/DeleteArchivedWorkflow.options");
/**
 * This object defines the command for delete workflow using workflow key within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.DeleteArchivedWorkflow = {
    name: "archived-workflow",
    aliases: ["arw"],
    description: "Delete an archived workflow from z/OSMF",
    type: "command",
    handler: (0, path_1.join)(__dirname, "../Delete.archived.common.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: ([
        DeleteArchivedWorkflow_options_1.DeleteArchivedWorkflowOptions.workflowKey,
        DeleteArchivedWorkflow_options_1.DeleteArchivedWorkflowOptions.workflowName
    ]),
    examples: [
        {
            description: "To delete an archived workflow from z/OSMF with workflow key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\"",
            options: "--workflow-key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\""
        },
        {
            description: "To delete an archived workflow from z/OSMF with workflow name \"testWorkflow\"",
            options: "--workflow-name \"testWorkflow\""
        },
        {
            description: "To delete multiple archived workflows from z/OSMF with names beginnig with \"test\"",
            options: "--workflow-name \"test.*\""
        }
    ]
};
//# sourceMappingURL=DeleteArchivedWorkflow.definition.js.map