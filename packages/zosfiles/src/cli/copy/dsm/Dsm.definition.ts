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
import { CopyOptions } from "../Copy.options";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const stringsCopy = (require("../../-strings-/en").default as typeof i18nTypings).COPY;
const { DESCRIPTION, POSITIONALS, EXAMPLES } = stringsCopy.ACTIONS.DATA_SET_MEMBER;
/**
 * This object defines the command for copy data set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const DsmDefinition: ICommandDefinition = {
    name: "data-set-member",
    aliases: ["dsm"],
    description: DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Dsm.handler"),
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
            name: "fromDataSetMemberName",
            type: "string",
            description: POSITIONALS.FROMDSMEMBERNAME,
            required: true,
        },
        {
            name: "toDataSetName",
            type: "string",
            description: POSITIONALS.TODSNAME,
            required: true,
        },
        {
            name: "toDataSetMemberName",
            type: "string",
            description: POSITIONALS.TODSMEMBERNAME,
            required: false,
        },
    ],
    options: ([
        CopyOptions.fromVolume,
        CopyOptions.toVolume,
        CopyOptions.alias,
        CopyOptions.replace,
        {
            name: "enqueue",
            aliases: ["enq"],
            description: stringsCopy.OPTIONS.ENQUEUE,
            type: "string",
            required: false,
            allowableValues: {
                values: ["EXCLU", "SHR", "SHRW"],
            },
        }
    ] as ICommandOptionDefinition[]).sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: EXAMPLES.EX1,
            options: `"user.from.set" "member.name" "user.to.set" "member.name"`
        },
        {
            description: EXAMPLES.EX2,
            options: `"user.from.set" "*" "user.to.set"`
        },
    ],
};
