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
const path_1 = require("path");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.DELETE.ACTIONS.ZFS;
/**
 * This object defines the command for delete zos-file-system within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
exports.ZfsDefinition = {
    name: "zos-file-system",
    aliases: ["zfs"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: (0, path_1.join)(__dirname, "zfs.handler"),
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
    options: [
        {
            name: "for-sure",
            aliases: ["f"],
            description: strings.OPTIONS.FOR_SURE,
            type: "boolean",
            required: true
        }
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"HLQ.MYNEW.ZFS" -f`
        }
    ]
};
//# sourceMappingURL=zfs.definition.js.map