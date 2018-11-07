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

export const SendToAddressSpaceCommandDefinition: ICommandDefinition = {
    name: "address-space",
    aliases: ["as"],
    summary: "Send data to a TSO address space",
    description: "Send data to the TSO address space, from which " +
    "you previously started and received a token (a.k.a 'servlet-key').",
    type: "command",
    handler: __dirname + "/SendToAddressSpace.handler",
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
    options: [
        {
            name: "data",
            required: true,
            description: "The data to which we want to send to the TSO address space represented " +
            "by the servlet key.",
            type: "string"
        }
    ],
    examples: [
        {
            description: `"Send the TIME TSO command to the TSO address space identified by IBMUSER-329-aafkaaoc"`,
            options: "IBMUSER-329-aafkaaoc --data \"TIME\"",
        }
    ],
};
