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
exports.ActiveWorkflowDetails = void 0;
const ActiveWorkflowDetails_common_options_1 = require("./ActiveWorkflowDetails.common.options");
const path_1 = require("path");
/**
 * This object defines the command for listing active workflow details within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.ActiveWorkflowDetails = {
    name: "active-workflow-details",
    aliases: ["awd"],
    description: "Get the details of an active z/OSMF workflow",
    type: "command",
    handler: (0, path_1.join)(__dirname, "./ActiveWorkflowDetails.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: ([
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.workflowName,
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.workflowKey,
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.listSteps,
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.stepsSummaryOnly,
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.listVariables,
        ActiveWorkflowDetails_common_options_1.ActiveWorkflowDetailsCommonOptions.skipWorkflowSummary
    ]),
    examples: [
        {
            description: "To list the details of an active workflow with key \"7c62c790-0340-86b2-61ce618d8f8c\" including its steps and variables",
            options: "--workflow-key \"7c62c790-0340-86b2-61ce618d8f8c\" --list-steps --list-variables"
        },
        {
            description: "To list the details of an active workflow with name \"testWorkflow\" including its steps and variables",
            options: "--workflow-name \"testWorkflow\" --list-steps --list-variables"
        }
    ]
};
//# sourceMappingURL=ActiveWorkflowDetails.definition.js.map