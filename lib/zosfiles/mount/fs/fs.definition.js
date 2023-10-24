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
exports.FsDefinition = void 0;
const fs_options_1 = require("./fs.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const fsStrings = fileStrings.MOUNT.ACTIONS.FS;
exports.FsDefinition = {
    name: "file-system",
    aliases: ["fs"],
    summary: fsStrings.SUMMARY,
    description: fsStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/fs.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fileSystemName",
            type: "string",
            description: fsStrings.POSITIONALS.FILESYSTEMNAME,
            required: true
        },
        {
            name: "mountPoint",
            type: "string",
            description: fsStrings.POSITIONALS.MOUNTPOINT,
            required: true
        }
    ],
    options: [
        fs_options_1.FsMountOptions.fsType,
        fs_options_1.FsMountOptions.mode
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
//# sourceMappingURL=fs.definition.js.map