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
exports.ZfsDefinition = void 0;
const zfs_options_1 = require("./zfs.options");
const Create_options_1 = require("../Create.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const zfsStrings = fileStrings.CREATE.ACTIONS.ZFS;
exports.ZfsDefinition = {
    name: "zos-file-system",
    aliases: ["zfs"],
    summary: zfsStrings.SUMMARY,
    description: zfsStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/zfs.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fileSystemName",
            type: "string",
            description: zfsStrings.POSITIONALS.FILESYSTEMNAME,
            required: true
        }
    ],
    options: [
        zfs_options_1.ZfsCreateOptions.owner,
        zfs_options_1.ZfsCreateOptions.group,
        zfs_options_1.ZfsCreateOptions.perms,
        zfs_options_1.ZfsCreateOptions.cylsPri,
        zfs_options_1.ZfsCreateOptions.cylsSec,
        Create_options_1.ZosFilesCreateOptions.storclass,
        Create_options_1.ZosFilesCreateOptions.mgntclass,
        Create_options_1.ZosFilesCreateOptions.dataclass,
        zfs_options_1.ZfsCreateOptions.volumes,
        zfs_options_1.ZfsCreateOptions.timeout
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
//# sourceMappingURL=zfs.definition.js.map