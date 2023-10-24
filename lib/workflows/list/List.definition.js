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
exports.ListDefinition = void 0;
const ActiveWorkflows_definition_1 = require("./activeWorkflows/ActiveWorkflows.definition");
const ActiveWorkflowDetails_definition_1 = require("./activeWorkflowDetails/ActiveWorkflowDetails.definition");
const RetrieveWorkflowDefinition_definition_1 = require("./retrieveWorkflowDefinition/RetrieveWorkflowDefinition.definition");
const ArchivedWorkflows_definition_1 = require("./archivedWorkflows/ArchivedWorkflows.definition");
/**
 * This object defines the command for the List group within zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.ListDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    description: "List the z/OSMF workflows for a system or a sysplex with filter options.",
    children: [
        ActiveWorkflows_definition_1.ActiveWorkflows,
        ActiveWorkflowDetails_definition_1.ActiveWorkflowDetails,
        RetrieveWorkflowDefinition_definition_1.RetrieveWorkflowDefinition,
        ArchivedWorkflows_definition_1.ArchivedWorkflows
    ]
};
//# sourceMappingURL=List.definition.js.map