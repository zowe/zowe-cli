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
        description: "How variable conflicts are to be handled.",
        type: "string",
        required: false,
        defaultValue: "outputFileValue",
        allowableValues: {
            values: ["outputFileValue", "existingValue", "leaveConflict"],
            caseSensitive: true
        },
    },

    /**
     * Step to be run.
     * @type {ICommandOptionDefinition}
     */
    stepName: {
        name: "step-name",
        aliases: ["sn"],
        description: "Specifies the step name that will run.",
        type: "string",
        required: false
    },

    /**
     * If the workflow contains any subsequent automated steps,
     * this property indicates whether z/OSMF is to perform the steps.
     * @type {ICommandOptionDefinition}
     */
    performOneStep: {
        name: "perform-one-step",
        aliases: ["pos"],
        description: "Identifies whether to perform just one specified step.",
        type: "boolean",
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
    },
};
