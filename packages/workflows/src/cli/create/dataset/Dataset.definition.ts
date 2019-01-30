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
 * This object defines the command for creating workflow instance from dataset withing zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const DataSet: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: "Create a workflow instance in z/OSMF using a Data set",
    type: "command",
    handler: join(__dirname, "../Create.shared.handler"),
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
            name: "definitionDataset",
            type: "string",
            description: "Data set containing workflow definiton",
            required: true,
        },
        {
            name: "systemName",
            description: "System where the workflow will run",
            type: "string",
            required: true
        },
        {
            name: "Owner",
            description: "User id of the owner of the workflow",
            type: "string",
            required: true
        },
    ],
    options: ([
        {
            name: "input-file",
            aliases: ["if"],
            description: "Properties file with pre-specified values for workflow variables ",
            type: "string",
            required: false
        },
        {
            name: "variables",
            aliases: ["vs"],
            description: "A list of one or more variables for the workflow.",
            type: "string",
            required: false
        },
        {
            name: "assignt-to-owner",
            aliases: ["ao"],
            description: "Indicates whether the workflow steps are assigned to the workflow owner",
            type: "boolean",
            required: false
        },
        {
            name: "access-type",
            aliases: ["at"],
            description: "Specifies the access type for the workflow. Public, Restricted or Private.",
            type: "string",
            required: false,
            allowableValues: {
                values : ["Public", "Restricted", "Private"],
                caseSensitive: true
            },
        },
        {
            name: "delete-completed",
            aliases: ["dc"],
            description: "Whether the successfully completed jobs to  be deleted from the JES spool.",
            type: "boolean",
            required: false
        },
        {
            name: "zosmf-version",
            aliases: ["zosmf-v"],
            description: "Identifies the version of the zOSMF workflow service.",
            type: "boolean",
            required: false
        },
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "some example of create",
            options: `"create create`
        }
    ],
};
