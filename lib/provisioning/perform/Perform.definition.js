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
exports.PerformCommand = void 0;
const Action_definition_1 = require("./action/Action.definition");
exports.PerformCommand = {
    name: "perform",
    aliases: ["perf"],
    type: "group",
    summary: "Perform instance actions.",
    description: "Perform actions against instances provisioned with z/OSMF.",
    children: [Action_definition_1.ActionDefinition]
};
//# sourceMappingURL=Perform.definition.js.map