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

import { ICommandDefinition } from "@brightside/imperative";

export const PingAddressSpaceCommandDefinition: ICommandDefinition = {
    name: "address-space",
    aliases: ["as"],
    summary: "Ping TSO address space",
    description: "Ping a TSO address space, from which " +
    "you previously started and received a token (a.k.a 'servlet-key').",
    type: "command",
    handler: __dirname + "/PingAddressSpace.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "servletKey",
            type: "string",
            description: "The servlet key from a previously started TSO address space.",
            required: true,
        },
    ],
    examples: [
        {
            description: "Ping the TSO address space identified by IBMUSER-329-aafkaaoc",
            options: "IBMUSER-329-aafkaaoc",
        }
    ],
};
