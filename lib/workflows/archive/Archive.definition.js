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
exports.ArchiveDefinition = void 0;
const Archive_workflow_definition_1 = require("./workflow/Archive.workflow.definition");
/**
 * This object defines the command for the archive group within zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.ArchiveDefinition = {
    name: "archive",
    type: "group",
    description: "Archive workflow instance in z/OSMF.",
    children: [
        Archive_workflow_definition_1.Workflow
    ]
};
//# sourceMappingURL=Archive.definition.js.map