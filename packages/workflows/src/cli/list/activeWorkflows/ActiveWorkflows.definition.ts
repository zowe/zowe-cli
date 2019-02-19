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
import { ListOptions } from "./ActiveWorkflows.options";
import { join } from "path";


/**
 * This object defines the command for listing workflow instance(s) in zOSMF.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const ActiveWorkflows: ICommandDefinition = {
    name: "active-workflows",
    aliases: ["aw"],
    summary: "List active workflow instance(s) in z/OSMF.",
    description: "List active workflow instance(s) in z/OSMF.\n" +
    "Omitting all options will list all workflows on the sysplex",
    type: "command",
    handler: join(__dirname, "ActiveWorkflows.handler"),
    profile: {
        optional: ["zosmf"],
    },
    options: ([
        ListOptions.workflowName,
        ListOptions.category,
        ListOptions.system,
        ListOptions.owner,
        ListOptions.vendor,
        ListOptions.statusName,
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "List the workflow with name \"testworkflow\"",
            options: "--wn \"testworkflow\""
        },
        {
            description: "List multiple active workflows matching the string \"workflow\"",
            options: "--wn \".*workflow.*\""
        }
    ],
};
