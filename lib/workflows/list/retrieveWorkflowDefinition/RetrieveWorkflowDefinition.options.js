"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrieveWorkflowDefinitionCommonOptions = void 0;
/**
 * Object containing all extra options to be used by the retrieve workflow definition commands.
 */
exports.RetrieveWorkflowDefinitionCommonOptions = {
    /**
     * Parameter to list workflow details by workflow name
     * @type {ICommandOptionDefinition}
     */
    definitionFilePath: {
        name: "workflow-name",
        aliases: ["wn"],
        description: "Specifies the location of the workflow definition file, which is either a UNIX path name or a fully qualified z/OS data set name.",
        type: "string",
        required: true,
        absenceImplications: ["workflow-key"],
        conflictsWith: ["workflow-key"]
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
    }
};
//# sourceMappingURL=RetrieveWorkflowDefinition.options.js.map