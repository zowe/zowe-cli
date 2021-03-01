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
import { IssueCommand } from "./issue/Issue.definition";
import { SshSession } from "@zowe/zos-uss-for-zowe-sdk";

export const definition: ICommandDefinition = {
    name: "zos-ssh",
    aliases: ["ssh", "zowe-uss", "uss"],
    type: "group",
    summary: "Issue z/OS USS commands and receive responses",
    description: "Issue z/OS USS commands remotely using an SSH session. Output from the commands is displayed on the local terminal.",
    children: [
        IssueCommand
    ],
    passOn: [
        {
            property: "options",
            value: SshSession.SSH_CONNECTION_OPTIONS,
            merge: true,
            ignoreNodes: [
                {type: "group"}
            ]
        }
    ]
};

module.exports = definition;
