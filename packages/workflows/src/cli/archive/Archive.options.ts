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
 * Object containing all extra options to be used by the archive workflow commands.
 */
export const ArchiveOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * The name of the workflow to be archived.
     * @type {ICommandOptionDefinition}
     */
    workflowName: {
        name: "workflow-name",
        aliases: ["wn"],
        type: "string",
        description: "The name of the workflow to be archived.",
        required: false,
    },

    /**
     * The workflow key of the workflow to be archived.
     * @type {ICommandOptionDefinition}
     */
    WorkflowKey: {
        name: "workflow-key",
        aliases: ["wk"],
        type: "string",
        description: "The workflow key of the workflow to be archived.",
        required: false,
        conflictsWith: ["workflow-name"]
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
