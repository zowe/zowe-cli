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
exports.StartDefinition = void 0;
const WorkflowStep_definition_1 = require("./workflowStep/WorkflowStep.definition");
const WorkflowFull_definition_1 = require("./workflowFull/WorkflowFull.definition");
/**
 * This object defines the command for the start group within zos-workflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.StartDefinition = {
    name: "start",
    aliases: ["sta"],
    type: "group",
    description: "Start a z/OSMF workflow on a z/OS system.",
    children: [
        WorkflowFull_definition_1.WorkflowFull,
        WorkflowStep_definition_1.WorkflowStep
    ]
};
//# sourceMappingURL=Start.definition.js.map