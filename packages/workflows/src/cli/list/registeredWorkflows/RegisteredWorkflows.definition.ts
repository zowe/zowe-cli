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
import { ListOptions } from "../List.options";
import { join } from "path";


/**
 * This object defines the command for listing workflow instance(s) in zOSMF.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const Workflow: ICommandDefinition = {
    name: "registered-workflows",
    aliases: ["reg"],
    description: "List a workflow instance(s) in z/OSMF",
    type: "command",
    handler: join(__dirname, "../List.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "workflowName",
            type: "string",
            description: "Specify a regular expression to match desired workflow names.",
            required: false,
        },
    ],
    options: ([
        ListOptions.category,
        ListOptions.system,
        ListOptions.owner,
        ListOptions.statusName,
        ListOptions.vendor,
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "List the workflow with name \"testworkflow\"",
            options: "\"testworkflow\""
        }
    ],
};
