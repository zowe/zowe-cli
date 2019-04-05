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
    workflowName: {
        name: "workflow-name",
        aliases: ["wn"],
        description: "List active workflow details by specified workflow name.",
        type: "string",
        required: false,
        absenceImplications: ["workflow-key"],
        conflictsWith: ["workflow-key"],
    },

    /**
     * Parameter to list workflow details by workflow key.
     * @type {ICommandOptionDefinition}
     */
    workflowKey: {
        name: "workflow-key",
        aliases: ["wk"],
        description: "List active workflow details by specified workflow key.",
        type: "string",
        required: false,
        // absenceImplications: ["workflow-name"]
        // conflictsWith: ["workflow-name"],
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
        required: false,
    },

    /**
     * Optional parameter for listing steps summary only
     * @type {ICommandOptionDefinition}
     */
    stepsSummaryOnly: {
        name: "steps-summary-only",
        aliases: ["sso"],
        description: "Optional parameter that lists only the steps summary.",
        type: "boolean",
        required: false,
        conflictsWith: ["list-steps"],
    },

    /**
     * Optional parameter for listing steps summary only
     * @type {ICommandOptionDefinition}
     */
    skipWotkflowSummary: {
        name: "skip-workflow-summary",
        aliases: ["sws"],
        description: "Optional parameter for skipping default workflow summary.",
        type: "boolean",
        required: false,
        impliesOneOf: ["steps-summary-only", "list-steps", "list-variables"],
    },


    /**
     * Optional parameter for listing variables properties.
     * @type {ICommandOptionDefinition}
     */
    listVariables: {
        name: "list-variables",
        aliases: ["lv"],
        description: "Optional parameter that skips the default workflow summary.",
        type: "boolean",
        required: false,
    },
};
