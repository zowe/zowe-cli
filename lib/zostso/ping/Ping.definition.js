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
exports.PingCommand = void 0;
const PingAddressSpace_definition_1 = require("./address_space/PingAddressSpace.definition");
exports.PingCommand = {
    name: "ping",
    aliases: [],
    type: "group",
    summary: "Ping a TSO address space",
    description: "Ping a TSO address space, from which " +
        "you previously started and received a token (a.k.a 'servelet-key').",
    children: [
        PingAddressSpace_definition_1.PingAddressSpaceCommandDefinition
    ]
};
//# sourceMappingURL=Ping.definition.js.map