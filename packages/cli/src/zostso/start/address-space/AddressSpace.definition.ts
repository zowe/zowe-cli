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

import { ICommandDefinition } from "npm:@zowe/imperative";
import { TsoProfileConstants } from "@zowe/zos-tso-for-zowe-sdk";

export const AddressSpaceDefinition: ICommandDefinition = {
    name: "address-space",
    aliases: ["as"],
    summary: "Start a TSO address space",
    description: "Start a TSO address space, from which " +
        "you will receive a token (a.k.a 'servlet-key') for further address space interaction " +
        "(e.g. termination).",
    type: "command",
    handler: __dirname + "/AddressSpace.handler",
    profile: {
        optional: ["zosmf", "tso"]
    },
    options: TsoProfileConstants.TSO_PROFILE_OPTIONS.concat([
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
            options: "--response-format-json"
        },
        {
            description: "Start TSO/E address space, and print only the servlet key",
            options: "--servlet-key-only"
        }
    ]
};
