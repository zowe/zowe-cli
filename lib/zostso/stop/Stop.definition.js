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
exports.StopCommand = void 0;
const AddressSpace_definition_1 = require("./address-space/AddressSpace.definition");
exports.StopCommand = {
    name: "stop",
    aliases: ["sp"],
    type: "group",
    summary: "Stop TSO/E address space",
    description: "Stop TSO/E address space.",
    children: [AddressSpace_definition_1.AddressSpaceDefinition]
};
//# sourceMappingURL=Stop.definition.js.map