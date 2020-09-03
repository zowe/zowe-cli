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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE.ACTIONS.ZFS;

/**
 * This object defines the command for delete zos-file-system within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const ZfsDefinition: ICommandDefinition = {
    name: "zos-file-system",
    aliases: ["zfs"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "zfs.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fileSystemName",
            type: "string",
            description: strings.POSITIONALS.FILESYSTEMNAME,
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
        }
    ] as ICommandOptionDefinition[]).sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"HLQ.MYNEW.ZFS" -f`
        }
    ]
};
