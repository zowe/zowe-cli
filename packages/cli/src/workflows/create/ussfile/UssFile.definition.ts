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
import { CreateCommonOptions } from "../Create.common.options";
import { join } from "path";

/**
 * This object defines the command for creating workflow instance from uss file within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const UssFile: ICommandDefinition = {
    name: "workflow-from-uss-file",
    aliases: ["wfuf"],
    description: "Create a workflow instance in z/OSMF using a USS file",
    type: "command",
    handler: join(__dirname, "../Create.common.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "workflowName",
            type: "string",
            description: "Name of the workflow instance to create",
            required: true
        }
    ],
    options: ([
        CreateCommonOptions.ussFile,
        CreateCommonOptions.systemName,
        CreateCommonOptions.owner,
        CreateCommonOptions.inputFile,
        CreateCommonOptions.variables,
        CreateCommonOptions.assignToOwner,
        CreateCommonOptions.accessType,
        CreateCommonOptions.deleteCompleted,
        CreateCommonOptions.overwrite
        // CreateCommonOptions.zosmfVersion
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "Create a workflow with name \"testworkflow\" using uss file \"/path/workflow.xml\" containing workflow definition, " +
            "on system \"TESTM1\" with owner \"OTHERID\" and delete workflow with the same name if it already exist in z/OSMF",
            options: "\"testworkflow\" --uss-file \"/path/workflow.xml\" --system-name \"TESTM1\" --owner \"OTHERID\" --overwrite"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using uss file \"/path/workflow.xml\" containing workflow definition, " +
            "on system \"TESTM1\" with owner \"MYSYSID\" and delete successfully completed jobs",
            options: "\"testworkflow\" --uss-file \"/path/workflow.xml\" --system-name \"TESTM1\" --owner \"MYSYSID\" --delete-completed"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using uss file \"/path/workflow.xml\" containing workflow definition, " +
            "on system \"TESTM1\" with owner \"MYSYSID\" and with variable values in the member PROPERTIES of data set TESTID.DATA",
            options: "\"testworkflow\" --uss-file \"/path/workflow.xml\" --system-name \"TESTM1\" --owner \"MYSYSID\" " +
                "--variables-input-file TESTID.DATA(PROPERTIES)"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using uss file \"/path/workflow.xml\" containing workflow definition, " +
            "on system \"TESTM1\" with owner \"MYSYSID\" and with variables VAR1 and VAR2 with values DUMMYVAL1 and DUMMYVAL2, " +
            "and assign it to the owner",
            options: "\"testworkflow\" --uss-file \"/path/workflow.xml\" --system-name \"TESTM1\"" +
                "--variables VAR1=DUMMYVAL1,VAR2=DUMMYVAL2 " +
                "--owner \"MYSYSID\" --assign-to-owner"
        }
    ]
};
