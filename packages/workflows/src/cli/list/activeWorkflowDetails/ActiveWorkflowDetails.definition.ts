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
import { ActiveWorkflowDetailsCommonOptions } from "./ActiveWorkflowDetails.common.options";
import { join } from "path";

/**
 * This object defines the command for listing active workflow details within zosworkflows.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const ActiveWorkflowDetails: ICommandDefinition = {
    name: "active-workflow-details",
    aliases: ["awd"],
    description: "Get the details of an active z/OSMF workflow",
    type: "command",
    handler: join(__dirname, "./ActiveWorkflowDetails.handler"),
    profile: {
        optional: ["zosmf"],
    },
    options: ([
        // ActiveWorkflowDetailsCommonOptions.byName,
        ActiveWorkflowDetailsCommonOptions.workflowKey,
        ActiveWorkflowDetailsCommonOptions.listSteps,
        ActiveWorkflowDetailsCommonOptions.listVariables,
    ]),
    examples: [
        {
            description: "To list the details of an active workflow with key \"7c62c790-0340-86b2-61ce618d8f8c\" including its steps and variables",
            options: "--workflow-key \"7c62c790-0340-86b2-61ce618d8f8c\" --list-steps --list-variables"
        }
    ],
};
