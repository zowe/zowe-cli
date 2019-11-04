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
import { CopyOptions } from "../Copy.options";

// Does not use the import in anticipation of some internationalization work to be done later.
const stringsCopy = (require("../../-strings-/en").default as typeof i18nTypings).COPY;
const { DESCRIPTION, POSITIONALS, EXAMPLES } = stringsCopy.ACTIONS.DATA_SET;

/**
 * This object defines the command for copying data sets within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const DsDefinition: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Ds.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "fromDataSetName",
            type: "string",
            description: POSITIONALS.FROMDSNAME,
            required: true,
        },
        {
            name: "toDataSetName",
            type: "string",
            description: POSITIONALS.TODSNAME,
            required: true,
        },
    ],
    options: ([
        CopyOptions.fromVolume,
        CopyOptions.toVolume,
        CopyOptions.alias,
        {
            name: "enqueue",
            aliases: ["enq"],
            description: stringsCopy.OPTIONS.ENQUEUE,
            type: "string",
            required: false,
            allowableValues: {
                values: ["EXCLU", "SHR"],
            },
        }
    ] as ICommandOptionDefinition[]),
    examples: [
        {
            description: EXAMPLES.EX1,
            options: `"user.from.set" "user.to.set"`
        }
    ],
};
