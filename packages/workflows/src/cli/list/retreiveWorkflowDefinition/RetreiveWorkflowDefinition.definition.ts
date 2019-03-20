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
import { RetreiveWorkflowDefinitionCommonOptions } from "./RetreiveWorkflowDefinition.options";
import { join } from "path";

/**
 * This object defines the command for retreaving workflow contents of zosworkflow definition.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const RetreiveWorkflowDefinition: ICommandDefinition = {
    name: "definition-file-details",
    aliases: ["dfd"],
    description: "Retrieve the contents of a z/OSMF workflow definition from a z/OS system.",
    type: "command",
    handler: join(__dirname, "./RetreiveWorkflowDefinition.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "definitionFilePath",
            description:
            "Specifies the location of the workflow definition file, which is either a UNIX path name or a fully qualified z/OS data set name.",
            type: "string",
            required: true,
        }
    ],
    options: ([
        RetreiveWorkflowDefinitionCommonOptions.listSteps,
        RetreiveWorkflowDefinitionCommonOptions.listVariables,
    ]),
    examples: [
        {
            description: "To list the contents of a workflow definition stored in the UNIX file \"/user/dir/workflow.xml\"" +
            " including its steps and variables",
            options: "\"/user/dir/workflow.xml\" --list-steps --list-variables"
        },
        {
            description: "To list the contents of a workflow definition stored in the z/OS data set \"USER.DATA.SET.XML\"" +
            " including its steps and variables",
            options: "--workflow-name \"testWorkflow\" --list-steps --list-variables"
        }
    ],
};
