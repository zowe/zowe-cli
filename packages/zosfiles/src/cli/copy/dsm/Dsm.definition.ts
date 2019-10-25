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

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COPY.ACTIONS.DATA_SET_MEMBER;

/**
 * This object defines the command for delete data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const DsmDefinition: ICommandDefinition = {
    name: "data-set-member",
    aliases: ["dsm"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Dsm.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "fromDataSetName",
            type: "string",
            description: strings.POSITIONALS.FROMDSNAME,
            required: true,
        },
        {
            name: "fromDataSetMemberName",
            type: "string",
            description: strings.POSITIONALS.FROMDSMEMBERNAME,
            required: true,
        },
        {
            name: "toDataSetName",
            type: "string",
            description: strings.POSITIONALS.TODSNAME,
            required: true,
        },
        {
            name: "toDataSetMemberName",
            type: "string",
            description: strings.POSITIONALS.TODSMEMBERNAME,
            required: false,
        },
    ],
    options: ([
        {
            name: "replace",
            aliases: ["r"],
            description: strings.OPTIONS.REPLACE,
            type: "boolean",
            required: false
        },
    ] as ICommandOptionDefinition[]).sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.cntl" -f`
        }
    ],
};
