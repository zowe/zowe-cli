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

import { ICommandDefinition, ICommandOptionDefinition } from "@brightside/imperative";
import { join } from "path";


/**
 * This object defines the command for delete workflow using workflow key withing  zosworkflows.
 * This is not something that is intended to be used outside of the zosworkflows package.
 *
 * @private
 */
export const WorkflowKey: ICommandDefinition = {
    name: "workflowKey",
    aliases: ["wk"],
    description: "Delete workflow with specified workflow key",
    type: "command",
    handler: join(__dirname, "WorkflowKey.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "workflowKey",
            type: "string",
            description: "workflow key",
            required: true,
        },
    ],
    outputFormatOptions: true,
    examples: [
        {
            description: "some example of delete",
            options: `"ibmuser.cntl" -f`
        }
    ],
};
