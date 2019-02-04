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
import { IssueCommand } from "./issue/Issue.definition";
import { ZosmfSession } from "../../../zosmf";

export const definition: ICommandDefinition = {
    name: "zos-unix",
    aliases: ["unix"],
    type: "group",
    summary: "Issue z/OS unix commands and collect responses",
    description: "Interact with z/OSMF console services or ssh connection." +
        "Issue z/OS unix commands and collect responses. ",
    children: [
        IssueCommand,
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
