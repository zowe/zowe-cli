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
exports.StartCommand = void 0;
const AddressSpace_definition_1 = require("./address-space/AddressSpace.definition");
exports.StartCommand = {
    name: "start",
    aliases: ["st"],
    type: "group",
    summary: "Start TSO/E address space",
    description: "Start TSO/E address space.",
    children: [
        AddressSpace_definition_1.AddressSpaceDefinition
    ]
};
//# sourceMappingURL=Start.definition.js.map