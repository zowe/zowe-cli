/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import { ListOptions } from "../List.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).LIST.ACTIONS.ALL_MEMBERS;

/**
 * List all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const AllMembersDefinition: ICommandDefinition = {
    name: "all-members",
    aliases: ["am"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/AllMembers.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        },
    ],
    options: [
        ListOptions.attributes,
        ListOptions.maxLength
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.asm"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.cntl" -a`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"ibmuser.cntl" --max 5`
        }
    ]
};
