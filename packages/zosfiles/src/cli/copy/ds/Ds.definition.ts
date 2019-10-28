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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COPY.ACTIONS.DATA_SET;

/**
 * This object defines the command for copying data sets within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const DsDefinition: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Ds.handler"),
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
            name: "toDataSetName",
            type: "string",
            description: strings.POSITIONALS.TODSNAME,
            required: true,
        },
    ],
    options: ([
        {
            name: "from-volume",
            aliases: ["fvol"],
            description: strings.OPTIONS.FROMVOLUME,
            type: "string",
            required: false
        },
        {
            name: "to-volume",
            aliases: ["tvol"],
            description: strings.OPTIONS.TOVOLUME,
            type: "string",
            required: false
        },
        {
            name: "alias",
            aliases: ["al"],
            description: strings.OPTIONS.ALIAS,
            type: "boolean",
            required: false
        },
    ] as ICommandOptionDefinition[]),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.cntl" -f`
        }
    ],
};
