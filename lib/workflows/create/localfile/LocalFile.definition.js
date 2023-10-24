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
exports.LocalFile = void 0;
const Create_common_options_1 = require("../Create.common.options");
const path_1 = require("path");
/**
 * This object defines the command for creating workflow instance from local file within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.LocalFile = {
    name: "workflow-from-local-file",
    aliases: ["wflf"],
    description: "Create a z/OSMF workflow on a z/OS system using a Local file",
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
        Create_common_options_1.CreateCommonOptions.localFile,
        Create_common_options_1.CreateCommonOptions.systemName,
        Create_common_options_1.CreateCommonOptions.owner,
        Create_common_options_1.CreateCommonOptions.inputFile,
        Create_common_options_1.CreateCommonOptions.variables,
        Create_common_options_1.CreateCommonOptions.assignToOwner,
        Create_common_options_1.CreateCommonOptions.accessType,
        Create_common_options_1.CreateCommonOptions.deleteCompleted,
        Create_common_options_1.CreateCommonOptions.overwrite,
        Create_common_options_1.CreateCommonOptions.remoteDirectory,
        Create_common_options_1.CreateCommonOptions.keepFiles
    ]),
    outputFormatOptions: true,
    examples: [
        {
            description: "Create a workflow with name \"testworkflow\" using the local file \"TESTID_WKFLOW.xml\" that contains the workflow " +
                "definition xml on the system \"TESTM1\" with owner \"OTHERID\" and delete workflow with the same name if it already exist in z/OSMF",
            options: "\"testworkflow\" --local-file \"TESTID_WKFLOW.xml\" --system-name \"TESTM1\" --owner \"OTHERID\" --overwrite"
        }
    ]
};
//# sourceMappingURL=LocalFile.definition.js.map