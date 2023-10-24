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
exports.DeleteCommand = void 0;
const DeleteInstance_definition_1 = require("./instance/DeleteInstance.definition");
exports.DeleteCommand = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    summary: "Delete instance.",
    description: "Deletes instance previously provisioned with z/OSMF cloud provisioning services.",
    children: [DeleteInstance_definition_1.DeleteInstanceDefinition]
};
//# sourceMappingURL=Delete.definition.js.map