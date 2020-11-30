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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";
import { CreateCommonOptions } from "../Create.common.options";
import { join } from "path";


/**
 * This object defines the command for creating workflow instance from dataset within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const DataSet: ICommandDefinition = {
    name: "workflow-from-data-set",
    aliases: ["wfds"],
    description: "Create a z/OSMF workflow on a z/OS system using a Data set",
    type: "command",
    handler: join(__dirname, "../Create.common.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "workflowName",
            type: "string",
            description: "Name of the workflow",
            required: true
        }
    ],
    options: ([
        CreateCommonOptions.dataSet,
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
            description: "Create a workflow with name \"testworkflow\" using the data set \"TESTID.WKFLOW\" that contains the workflow " +
            "definition xml on the system \"TESTM1\" with owner \"OTHERID\" and delete workflow with the same name if it already exist in z/OSMF",
            options: "\"testworkflow\" --data-set \"TESTID.WKFLOW\" --system-name \"TESTM1\" --owner \"OTHERID\" --overwrite"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using data set \"TESTID.WKFLOW\" containing workflow definition xml, " +
            "on system \"TESTM1\" with owner \"MYSYSID\" and delete succesfully completed jobs",
            options: "\"testworkflow\" --data-set \"TESTID.WKFLOW\" --system-name \"TESTM1\" --owner \"MYSYSID\" --delete-completed"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using data set \"TESTID.WKFLOW\" containing workflow definition xml, " +
            "on system \"TESTM1\" with owner \"MYSYSID\" and with variable values in the member PROPERTIES of data set TESTID.DATA",
            options: "\"testworkflow\" --data-set \"TESTID.WKFLOW\" --system-name \"TESTM1\" --owner \"MYSYSID\" " +
                "--variables-input-file TESTID.DATA(PROPERTIES)"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using the data set \"TESTID.WKFLOW\" that contains a workflow definition xml" +
            ", on a system \"TESTM1\" with owner \"MYSYSID\" and with the variable name DUMMYVAR and the value DUMMYVAL. Assign it to the owner",
            options: "\"testworkflow\" --data-set \"TESTID.WKFLOW\" --system-name \"TESTM1\" --owner \"MYSYSID\" --variables DUMMYVAR=DUMMYVAL " +
                "--assign-to-owner"
        },
        {
            description: "Create a workflow with name \"testworkflow\" using the data set \"TESTID.WKFLOW\" that contains the workflow " +
            "definition xml on the system \"TESTM1\" with owner \"OTHERID\" and delete workflow with the same name if it already exist in z/OSMF " +
            "with a custom JOB statement",
            options: "\"testworkflow\" --data-set \"TESTID.WKFLOW\" --system-name \"TESTM1\" --owner \"OTHERID\" --overwrite " +
                "--workflow-job-statement \"//JOBNAME JOB (000000000),\" \"//    CLASS=A,MSGCLASS=A,REGION=0M\""
        }
    ]
};
