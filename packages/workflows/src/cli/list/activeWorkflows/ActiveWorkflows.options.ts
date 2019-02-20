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
 * Object containing all extra options to be used by the list workflow commands.
 */
export const ListOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * The name of the workflow.
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
     * Category of the workflow, which is either general or configuration
     * @type {ICommandOptionDefinition}
     */
    category: {
        name: "category",
        aliases: ["cat"],
        description: "Filter by the category of the workflow(s), which is either general or configuration.",
        type: "string",
        required: false
    },

    /**
     * Nickname of the system on which the workflow is to be performed.
     * @type {ICommandOptionDefinition}
     */
    system: {
        name: "system",
        aliases: ["sys"],
        description: "Filter by the nickname of the system on which the workflow(s) is/are active.",
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
     * Name of the vendor that provided the workflow definition file.
     * @type {ICommandOptionDefinition}
     */
    vendor: {
        name: "vendor",
        aliases: ["vd"],
        description: "Filter by the name of the vendor that provided the workflow(s) definition file.",
        type: "string",
        required: false,
    },

    /**
     * Workflow status.
     * @type {ICommandOptionDefinition}
     */
    statusName: {
        name: "status-name",
        aliases: ["sn"],
        description: "Filter by the status of the workflow(s).",
        type: "string",
        required: false,
        allowableValues: {
            values : ["in-progress", "complete", "automation-in-progress", "canceled"],
            caseSensitive: true
        },
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
};
