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
import { StartCommand } from "./start/Start.definition";
import { SendCommand } from "./send/Send.definition";
import { StopCommand } from "./stop/Stop.definition";
import { PingCommand } from "./ping/Ping.definition";
import { IssueCommand } from "./issue/Issue.definition";
import { ZosmfSession } from "../../../zosmf";

export const definition: ICommandDefinition = {
    name: "zos-tso",
    aliases: ["tso"],
    type: "group",
    summary: "Interact with TSO",
    description: "Issue TSO commands and interact with TSO address spaces",
    children: [
        SendCommand, StartCommand, PingCommand, StopCommand, IssueCommand
    ],
    passOn: [{
        property: "options",
        value: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
        merge: true,
        ignoreNodes: [
            {
                type: "group"
            }
        ]
    }]
};

module.exports = definition;
