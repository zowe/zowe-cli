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
const zos_tso_for_zowe_sdk_1 = require("@zowe/zos-tso-for-zowe-sdk");
exports.AddressSpaceDefinition = {
    name: "address-space",
    aliases: ["as"],
    description: "Start a TSO address space, from which " +
        "you will receive a token (a.k.a 'servlet-key') for further address space interaction " +
        "(e.g. termination).",
    type: "command",
    handler: __dirname + "/AddressSpace.handler",
    profile: {
        optional: ["zosmf", "tso"]
    },
    options: zos_tso_for_zowe_sdk_1.TsoProfileConstants.TSO_PROFILE_OPTIONS.concat([
        {
            name: "servlet-key-only", aliases: ["sko"],
            description: "Specify this option to print only the servlet key",
            type: "boolean"
        }
    ]),
    examples: [
        {
            description: "Start TSO/E address space",
            options: ""
        },
        {
            description: "Start TSO/E address space, and receive response in JSON format",
            options: "--rfj"
        },
        {
            description: "Start TSO/E address space, and print only the servlet key",
            options: "--sko"
        }
    ]
};
//# sourceMappingURL=AddressSpace.definition.js.map