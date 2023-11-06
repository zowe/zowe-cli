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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";
import { SshDefinition } from "./ssh/Ssh.definition";

/**
 * Definition for the "issue" group of commands under the Shell plugin
 */
export const IssueCommand: ICommandDefinition = {
    name: "issue", aliases: ["iss"],
    summary: "Issue a command",
    description: "Issue a z/OS USS command.",
    type: "group",
    children: [SshDefinition]
};
