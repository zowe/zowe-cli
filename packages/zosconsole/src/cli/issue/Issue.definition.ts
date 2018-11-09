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
import { IssueCommandDefinition } from "./command/Command.definition";

export const IssueCommand: ICommandDefinition = {
    name: "issue",
    type: "group",
    summary: "Issue z/OS Console Commands",
    description: "Issue z/OS console commands and optionally collect responses.",
    children: [
        IssueCommandDefinition,
    ],
};
