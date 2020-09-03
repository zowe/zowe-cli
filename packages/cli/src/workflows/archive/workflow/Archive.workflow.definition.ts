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
import { ArchiveOptions } from "../Archive.options";
import { join } from "path";

/**
 * This object defines the command for archiving workflow instance on zOSMF.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const Workflow: ICommandDefinition = {
    name: "active-workflow",
    aliases: ["aw"],
    description: "Archive an active workflow instance in z/OSMF.",
    type: "command",
    handler: join(__dirname, "../Archive.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: ([
        ArchiveOptions.workflowName,
        ArchiveOptions.workflowKey
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "Archive a workflow with workflow name \"testworkflow\"",
            options: "--wn \"testworkflow\" "
        },
        {
            description: "Archive multiple workflows with workflow names starting with \"test\"",
            options: "--wn \"test.*\" "
        },
        {
            description: "Archive a workflow with workflow key \"123-456-abv-xyz\"",
            options: "--wk \"123-456-abv-xyz\" "
        }
    ]
};
