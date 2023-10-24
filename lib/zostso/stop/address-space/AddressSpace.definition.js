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
exports.AddressSpaceDefinition = void 0;
exports.AddressSpaceDefinition = {
    name: "address-space",
    aliases: ["as"],
    description: "Stop a TSO address space, from which " +
        "you previously started and received a token (a.k.a 'servlet-key').",
    type: "command",
    handler: __dirname + "/AddressSpace.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "servletkey",
            required: true,
            type: "string",
            description: "The servlet key from a previously started TSO address space."
        }
    ],
    examples: [
        {
            description: "Stop the TSO address space identified by IBMUSER-329-aafkaaoc",
            options: "IBMUSER-329-aafkaaoc"
        }
    ]
};
//# sourceMappingURL=AddressSpace.definition.js.map