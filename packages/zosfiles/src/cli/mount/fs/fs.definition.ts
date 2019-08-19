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

import { ICommandDefinition } from "@zowe/imperative";
import { FsMountOptions } from "./fs.options";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = (require("../../-strings-/en").default as typeof i18nTypings);
const fsStrings = fileStrings.MOUNT.ACTIONS.FS;

export const FsDefinition: ICommandDefinition = {
    name: "file-system",
    aliases: ["fs"],
    summary: fsStrings.SUMMARY,
    description: fsStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/fs.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "fileSystemName",
            type: "string",
            description: fsStrings.POSITIONALS.FILESYSTEMNAME,
            required: true,
        },
        {
            name: "mountPoint",
            type: "string",
            description: fsStrings.POSITIONALS.MOUNTPOINT,
            required: true,
        },
    ],
    options: [
        FsMountOptions.fsType,
        FsMountOptions.mode
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: fsStrings.EXAMPLES.EX1,
            options: "MY.ZFS /a/ibmuser/mountdir"
        },
        {
            description: fsStrings.EXAMPLES.EX2,
            options: "MY.HFS /a/ibmuser/mountdir --ft HFS -m rdwr"
        }
    ]
};
