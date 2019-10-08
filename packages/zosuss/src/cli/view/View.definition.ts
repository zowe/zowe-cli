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
import { FileDefinition } from "./file/File.definition";

/**
 * Definition for the "issue" group of commands under the Shell plugin
 */
export const ViewCommand: ICommandDefinition = {
    name: "view", aliases: ["vw"],
    summary: "View a file",
    description: "View a z/OS USS file",
    type: "group",
    children: [FileDefinition],
};
