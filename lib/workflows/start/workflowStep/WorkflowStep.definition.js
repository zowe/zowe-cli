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
exports.WorkflowStep = void 0;
const path_1 = require("path");
const Start_common_options_1 = require("../Start.common.options");
/**
 * This object defines the command for delete workflow using workflow key within zos-workflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.WorkflowStep = {
    name: "workflow-step",
    aliases: ["ws"],
    description: "Will run given step of workflow instance plus following steps if specified by --perform-following-steps option.",
    type: "command",
    handler: (0, path_1.join)(__dirname, "./WorkflowStep.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "stepName",
            description: "Specifies the step name that will be run.",
            type: "string",
            required: true
        }
    ],
    options: ([
        Start_common_options_1.StartCommonOptions.workflowKey,
        Start_common_options_1.StartCommonOptions.workflowName,
        Start_common_options_1.StartCommonOptions.resolveConflict,
        Start_common_options_1.StartCommonOptions.performFollowingSteps
        // StartCommonOptions.zosmfVersion,
    ]),
    examples: [
        {
            description: "To start step \"Step1\" only in a workflow instance in z/OSMF with workflow key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\"",
            options: "\"Step1\" --workflow-key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\""
        },
        {
            description: "To start a workflow instance in z/OSMF from step \"Step1\" with workflow key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\"",
            options: "\"Step1\" --workflow-key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\" --perform-following-steps"
        },
        {
            description: "To start step \"Step1\" only in a workflow instance in z/OSMF with workflow key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\"" +
                "and if there is a conflict in variable's value use the value that is in output file",
            options: "\"Step1\" --workflow-key \"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0\" --resolve-conflict-by \"outputFileValue\""
        },
        {
            description: "To start step \"Step1\" only in a workflow instance in z/OSMF with workflow name \"testWorkflow\"",
            options: "\"Step1\" --workflow-name \"testWorkflow\""
        }
    ]
};
//# sourceMappingURL=WorkflowStep.definition.js.map