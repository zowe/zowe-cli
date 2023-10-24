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
const Logs_definition_1 = require("./logs/Logs.definition");
exports.ListDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: "List z/OS logs",
    description: "List z/OS logs by invoking z/OSMF REST API.",
    children: [Logs_definition_1.LogsDefinition]
};
//# sourceMappingURL=List.definition.js.map