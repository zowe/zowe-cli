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
exports.DeleteDefinition = void 0;
const DeleteActiveWorkflow_definition_1 = require("./deleteActiveWorkflow/DeleteActiveWorkflow.definition");
const DeleteArchivedWorkflow_definition_1 = require("./deleteArchivedWorkflow/DeleteArchivedWorkflow.definition");
/**
 * This object defines the command for the delete group within zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.DeleteDefinition = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    description: "Delete an active workflow or an archived workflow from z/OSMF.",
    children: [
        DeleteActiveWorkflow_definition_1.DeleteActiveWorkflow,
        DeleteArchivedWorkflow_definition_1.DeleteArchivedWorkflow
    ]
};
//# sourceMappingURL=Delete.definition.js.map