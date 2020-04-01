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

import { ICommandOptionDefinition } from "@zowe/imperative";

/**
 * Object containing all extra options to be used by the delete active workflow commands.
 */
export const DeleteWorkflowOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * Parameter to delete workflow by workflow name
     * @type {ICommandOptionDefinition}
     */
    workflowName: {
        name: "workflow-name",
        aliases: ["wn"],
        description: "Delete active workflow by specified workflow name",
        type: "string",
        required: false,
        absenceImplications: ["workflow-key"],
        conflictsWith: ["workflow-key"]
    },

    /**
     * Parameter to delete workflow by workflow key.
     * @type {ICommandOptionDefinition}
     */
    workflowKey: {
        name: "workflow-key",
        aliases: ["wk"],
        description: "Delete active workflow by specified workflow key",
        type: "string",
        required: false
        // absenceImplications: ["by-name"]
        // conflictsWith: ["by-name"],
    }
};
