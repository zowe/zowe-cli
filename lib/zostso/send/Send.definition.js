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
exports.SendCommand = void 0;
const SendToAddressSpace_definition_1 = require("./address_space/SendToAddressSpace.definition");
exports.SendCommand = {
    name: "send",
    aliases: [],
    type: "group",
    summary: "Send data to TSO",
    description: "Send data to TSO and collect responses until the prompt is reached.",
    children: [
        SendToAddressSpace_definition_1.SendToAddressSpaceCommandDefinition
    ]
};
//# sourceMappingURL=Send.definition.js.map