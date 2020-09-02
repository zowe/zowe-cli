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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";
import { join } from "path";
import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE.ACTIONS.VSAM;

/**
 * This object defines the command for delete vsam-cluster within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const VsamDefinition: ICommandDefinition = {
    name: "data-set-vsam",
    aliases: ["vsam"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Vsam.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: strings.POSITIONALS.DSNAME,
            required: true
        }
    ],
    options: ([
        {
            name: "for-sure",
            aliases: ["f"],
            description: strings.OPTIONS.FOR_SURE,
            type: "boolean",
            required: true
        },
        {
            name: "erase",
            aliases: ["e"],
            description: strings.OPTIONS.ERASE,
            type: "boolean",
            defaultValue: false
        },
        {
            name: "purge",
            aliases: ["p"],
            description: strings.OPTIONS.PURGE,
            type: "boolean",
            defaultValue: false
        }
    ] as ICommandOptionDefinition[]).sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.cntl.vsam" -f`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.AAA.**.FFF" -f`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"ibmuser.cntl.vsam" -f --purge`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"ibmuser.cntl.vsam" -f --erase`
        }
    ]
};
