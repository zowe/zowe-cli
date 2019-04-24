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
import { ListArchivedWorkflowsOptions } from "./ArchivedWorkflows.options";
import { join } from "path";


/**
 * This object defines the command for listing workflow instance(s) in zOSMF.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const ArchivedWorkflows: ICommandDefinition = {
    name: "archived-workflows",
    aliases: ["arw"],
    summary: "List the archived workflows for a system.",
    description: "List the archived workflows for a system.\n" +
    "Multiple filters can be used together.\n" +
    "Omitting all options will list all archived workflows on the sysplex",
    type: "command",
    handler: join(__dirname, "ArchivedWorkflows.handler"),
    profile: {
        optional: ["zosmf"],
    },
    options: ([
        ListArchivedWorkflowsOptions.workflowName,
        ListArchivedWorkflowsOptions.owner,
        ListArchivedWorkflowsOptions.orderBy,
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "List the archived workflow with name \"testworkflow\"",
            options: "--wn \"testworkflow\""
        },
        {
            description: "List multiple archived workflows on the entire syspex with names containing \"workflow\" from oldest to the newest",
            options: "--wn \".*workflow.*\" --asc"
        },
        {
            description: "List multiple archived workflows on system with names beginning with \"test\" that have owner \"owner1\"",
            options: "--wn \"test.*\" --ow \"owner1\""
        }
    ],
};
