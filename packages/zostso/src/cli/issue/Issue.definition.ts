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
import {
    CommandDefinition
} from "./command/Command.definition";

export const IssueCommand: ICommandDefinition = {
    name: "issue",
    aliases: [],
    type: "group",
    summary: "Issue TSO commands",
    description: "Issue TSO commands",
    children: [
        CommandDefinition,
    ],
};
