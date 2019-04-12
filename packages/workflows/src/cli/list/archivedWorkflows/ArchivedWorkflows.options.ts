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
 * Object containing all extra options to be used by the list archived-workflow commands.
 */
export const ListArchivedWorkflowsOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * The domain that is associated with the workflow that was performed.
     * @type {ICommandOptionDefinition}
     */
    workflowName: {
        name: "workflow-name",
        aliases: ["wn"],
        description: "Filter by workflow name. For wildcard use .*",
        type: "string",
        required: false
    },

    /**
     * Workflow owner (a valid z/OS user ID).
     * @type {ICommandOptionDefinition}
     */
    owner: {
        name: "owner",
        aliases: ["ow"],
        description: "Filter by owner of the workflow(s) (a valid z/OS user ID).",
        type: "string",
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
        type: "string",
        required: false
    },

    /**
     * Optional parameter for sorting workflows by date.
     * @type {ICommandOptionDefinition}
     */
    asc: {
        name: "asc",
        aliases: ["asc"],
        description: "Optional parameter for listing workflows from the oldest to the newest.",
        type: "boolean",
        required: false
    },

    /**
     * Optional parameter for listing variables properties.
     * @type {ICommandOptionDefinition}
     */
    desc: {
        name: "desc",
        aliases: ["desc"],
        description: "Optional parameter for listing workflows from the newest to the oldest.",
        type: "boolean",
        required: false
    },
};
