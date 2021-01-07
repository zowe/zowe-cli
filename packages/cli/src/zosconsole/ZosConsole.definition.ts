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

import { ICommandDefinition } from "@zowe/imperative";
import { CollectCommand } from "./collect/Collect.definition";
import { IssueCommand } from "./issue/Issue.definition";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";

export const definition: ICommandDefinition = {
    name: "zos-console",
    aliases: ["console"],
    type: "group",
    summary: "Issue z/OS console commands and collect responses",
    description: "Interact with z/OSMF console services. Issue z/OS console commands and collect responses. " +
        "z/OS console services establishes extended MCS (EMCS) consoles on behalf of the user, " +
        "which are used to issue the commands and collect responses." +
        "\n\n" +
        "Important! Before you use commands in the zos-console command group, ensure that you understand " +
        "the implications of issuing z/OS console commands in your environment.",
    children: [
        CollectCommand,
        IssueCommand
    ],
    passOn: [
        {
            property: "options",
            value: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
            merge: true,
            ignoreNodes: [
                {type: "group"}
            ]
        }
    ]
};

module.exports = definition;
