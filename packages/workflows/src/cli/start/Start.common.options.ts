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
 * Object containing all extra options to be used by the start workflow commands.
 */
export const StartCommonOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * Indicates how variable conflicts are to be handled when
     * the Workflows task reads in the output file from a step.
     * @type {ICommandOptionDefinition}
     */
    resolveConflict: {
        name: "resolve-conflict-by",
        aliases: ["rcb"],
        description: "How variable conflicts should be handled.\n Options:\n " +
            "outputFileValue: Allow the output file values to override the existing values.\n" +
            "existingValue: Use the existing variables values instead of the output file values.\n" +
            "leaveConflict: Automation is stopped. The user must resolve the conflict manually.",
        type: "string",
        required: false,
        defaultValue: "outputFileValue",
        allowableValues: {
            values: ["^outputFileValue$", "^existingValue$", "^leaveConflict$"],
            caseSensitive: true
        }
    },

    /**
     * Workflow key of workflow to be run.
     * @type {ICommandOptionDefinition}
     */
    workflowKey: {
        name: "workflow-key",
        aliases: ["wk"],
        type: "string",
        description: "Workflow key of workflow instance to be started",
        required: false,
        absenceImplications: ["workflow-name"],
        conflictsWith: ["workflow-name"]
    },

    /**
     * Workflow name of workflow to be run.
     * @type {ICommandOptionDefinition}
     */
    workflowName: {
        name: "workflow-name",
        aliases: ["wn"],
        type: "string",
        description: "Workflow name of workflow instance to be started"
        // absenceImplications: ["with-workflow-key"],
        // conflictsWith: ["with-workflow-key"]
    },

    /**
     * If the workflow contains any subsequent automated steps,
     * this property indicates whether z/OSMF is to perform the steps.
     * @type {ICommandOptionDefinition}
     */
    performFollowingSteps: {
        name: "perform-following-steps",
        aliases: ["pfs"],
        description: "Identifies whether to perform also following steps in the workflow instance.",
        type: "boolean",
        defaultValue: false,
        required: false
    },

    /**
     * Identifies whether to wait for workflow instance to finish.
     * @type {ICommandOptionDefinition}
     */
    wait: {
        name: "wait",
        aliases: ["w"],
        description: "Identifies whether to wait for workflow instance to finish.",
        type: "boolean",
        required: false
    },

    /**
     * Identifies the version of the zOSMF workflow service.
     * @type {ICommandOptionDefinition}
     */
    zosmfVersion: {
        name: "zosmf-version",
        aliases: ["zosmf-v"],
        description: "Identifies the version of the zOSMF workflow service.",
        type: "boolean",
        required: false
    }
};
