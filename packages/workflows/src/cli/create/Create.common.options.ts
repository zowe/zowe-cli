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
 * Object containing all extra options to be used by the create workflow commands.
 */
export const CreateCommonOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * Data set containing workflow definiton option.
     * @type {ICommandOptionDefinition}
     */
    dataSet: {
        name: "data-set",
        aliases: ["ds"],
        type: "string",
        description: "Data set that contains a workflow definiton.",
        required: true,
    },

    /**
     * Uss file containing workflow definiton option.
     * @type {ICommandOptionDefinition}
     */
    ussFile: {
        name: "uss-file",
        aliases: ["uf"],
        type: "string",
        description: "Uss file that contains workflow definiton.",
        required: true,
    },

    /**
     * System where the workflow will run.
     * @type {ICommandOptionDefinition}
     */
    systemName: {
        name: "system-name",
        aliases: ["sn"],
        description: "z/OS system to execute the workflow.",
        type: "string",
        required: true
    },

    /**
     * User id of the owner of the workflow.
     * @type {ICommandOptionDefinition}
     */
    owner: {
        name: "owner",
        aliases: ["ow"],
        description: "User ID of the workflow owner. This user can perform the workflow steps or delegate the steps to other users.",
        type: "string",
        required: true
    },

    /**
     * Property file containing key-value pairs as workflow variables.
     * @type {ICommandOptionDefinition}
     */
    inputFile: {
        name: "variables-input-file",
        aliases: ["vif"],
        description: "Specifies an optional properties file that you can use to pre-specify values for one or more of the variables that" +
        " are defined in the workflow definition file.",
        type: "string",
        required: false
    },

    /**
     * Variables list for workflow.
     * @type {ICommandOptionDefinition}
     */
    variables: {
        name: "variables",
        aliases: ["vs"],
        description: "Includes a list of variables for the workflow. " +
        "The variables that you specify here take precedence over the variables that are specified in the workflow variable input file.",
        type: "string",
        required: false
    },

    /**
     * Indicates whether the workflow steps are assigned to the workflow owner.
     * @type {ICommandOptionDefinition}
     */
    assignToOwner: {
        name: "assign-to-owner",
        aliases: ["ato"],
        description: "Indicates whether the workflow steps are assigned to the workflow owner.",
        type: "boolean",
        required: false
    },

    /**
     * Specifies the access type for the workflow. Public, Restricted or Private.
     * @type {ICommandOptionDefinition}
     */
    accessType: {
        name: "access-type",
        aliases: ["at"],
        description: "Specifies the access type for the workflow. Public, Restricted or Private.",
        type: "string",
        required: false,
        allowableValues: {
            values : ["Public", "Restricted", "Private"],
            caseSensitive: true
        },
    },

    /**
     * Whether the successfully completed jobs to  be deleted from the JES spool.
     * @type {ICommandOptionDefinition}
     */
    deleteCompleted: {
        name: "delete-completed",
        aliases: ["dc"],
        description: "Whether the successfully completed jobs to be deleted from the JES spool.",
        type: "boolean",
        required: false
    },

    /**
     * Specifies whether delete workflow with the same name if it already exists.
     * @type {ICommandOptionDefinition}
     */
    overwrite: {
        name: "overwrite",
        aliases: ["ov"],
        description: "Specifies whether the workflow with the same name should be deleted if it already exists.",
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
