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

import { ICommandOptionDefinition } from "@brightside/imperative";

/**
 * Object containing all extra options to be used by the list active workflow details commands.
 */
export const ActiveWorkflowDetailsCommonOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * Parameter to list workflow details by workflow name
     * @type {ICommandOptionDefinition}
     */
    byName: {
        name: "by-name",
        aliases: ["name"],
        description: "List active workflow details by specified workflow name",
        type: "string",
        required: false,
        // absenceImplications: ["by-workflow-key"],
        // conflictsWith: ["by-workflow-key"],
    },

    /**
     * Parameter to list workflow details by workflow key.
     * @type {ICommandOptionDefinition}
     */
    byWorkflowKey: {
        name: "by-workflow-key",
        aliases: ["wk"],
        description: "List active workflow details by specified workflow key",
        type: "string",
        required: true,
        // absenceImplications: ["by-name"]
        // conflictsWith: ["by-name"],
    },

    /**
     * Optional parameter for listing steps properties.
     * @type {ICommandOptionDefinition}
     */
    listSteps: {
        name: "list-steps",
        aliases: ["ls"],
        description: "Optional parameter for listing steps and their properties.",
        type: "boolean",
        required: false
    },

    /**
     * Optional parameter for listing variables properties.
     * @type {ICommandOptionDefinition}
     */
    listVariables: {
        name: "list-variables",
        aliases: ["lv"],
        description: "Optional parameter for listing variables and their properties.",
        type: "boolean",
        required: false
    },
};
