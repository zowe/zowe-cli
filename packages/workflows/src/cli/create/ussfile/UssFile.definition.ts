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
import { CreateCommonOptions } from "../Create.common.options";
import { join } from "path";


/**
 * This object defines the command for creating workflow instance from uss file within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const UssFile: ICommandDefinition = {
    name: "uss-file",
    aliases: ["uf"],
    description: "Create a workflow instance in z/OSMF using a USS file",
    type: "command",
    handler: join(__dirname, "../Create.common.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "workflowName",
            type: "string",
            description: "Name of the workflow instance to create",
            required: true,
        },
        {
            name: "definitionUssFile",
            type: "string",
            description: "USS file containing workflow definiton",
            required: true,
        },
        {
            name: "systemName",
            description: "System where the workflow will run",
            type: "string",
            required: true
        },
        {
            name: "owner",
            description: "User id of the owner of the workflow",
            type: "string",
            required: true
        },
    ],
    options: ([
        CreateCommonOptions.inputFile,
        CreateCommonOptions.variables,
        CreateCommonOptions.assignToOwner,
        CreateCommonOptions.accessType,
        CreateCommonOptions.deleteCompleted,
        // CreateCommonOptions.zosmfVersion
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "Create a workflow with name \"testworkflow\" uss file \"/path/workflow.xml\", system name \"TESTM1\" and owner \"testid\"",
            options: "\"testworkflow\" \"/path/workflow.xml\" \"TESTM1\" \"testid\""
        }
    ],
};
