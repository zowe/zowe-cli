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
import { CreateDefaults } from "../../../api/methods/create";
import { ZfsCreateOptions } from "./zfs.options";
import { ZosFilesConstants } from "../../../api";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = (require("../../-strings-/en").default as typeof i18nTypings);
const zfsStrings = fileStrings.CREATE.ACTIONS.ZFS;

export const ZfsDefinition: ICommandDefinition = {
    name: "zos-file-system",
    aliases: ["zfs"],
    summary: zfsStrings.SUMMARY,
    description: zfsStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/zfs.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "fileSystemName",
            type: "string",
            description: zfsStrings.POSITIONALS.FILESYSTEMNAME,
            required: true,
        },
    ],
    options: [
        ZfsCreateOptions.owner,
        ZfsCreateOptions.group,
        ZfsCreateOptions.perms,
        ZfsCreateOptions.cylsPri,
        ZfsCreateOptions.cylsSec,
        ZosFilesCreateOptions.storeclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZfsCreateOptions.volumes,
        ZfsCreateOptions.timeout
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: zfsStrings.EXAMPLES.DEFAULT_VALUES,
            options: "HLQ.MYNEW.ZFS"
        },
        {
            description: zfsStrings.EXAMPLES.SPECIFY_CYLS,
            options: "HLQ.MYNEW.ZFS --cp 100 --cs 10"
        },
        {
            description: zfsStrings.EXAMPLES.SPECIFY_VOLUMES,
            options: "HLQ.MYNEW.ZFS -v ZFS001 ZFS002"
        }
    ]
};
