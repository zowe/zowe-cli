"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSet = void 0;
const Create_common_options_1 = require("../Create.common.options");
const path_1 = require("path");
/**
 * This object defines the command for creating workflow instance from dataset within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.DataSet = {
    name: "workflow-from-data-set",
    aliases: ["wfds"],
    description: "Create a z/OSMF workflow on a z/OS system using a Data set",
    type: "command",
    handler: (0, path_1.join)(__dirname, "../Create.common.handler"),
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
        Create_common_options_1.CreateCommonOptions.dataSet,
        Create_common_options_1.CreateCommonOptions.systemName,
        Create_common_options_1.CreateCommonOptions.owner,
        Create_common_options_1.CreateCommonOptions.inputFile,
        Create_common_options_1.CreateCommonOptions.variables,
        Create_common_options_1.CreateCommonOptions.assignToOwner,
        Create_common_options_1.CreateCommonOptions.accessType,
        Create_common_options_1.CreateCommonOptions.deleteCompleted,
        Create_common_options_1.CreateCommonOptions.overwrite
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
        }
    ]
};
//# sourceMappingURL=Dataset.definition.js.map