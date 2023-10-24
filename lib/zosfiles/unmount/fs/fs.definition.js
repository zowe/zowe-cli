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
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const fsStrings = fileStrings.UNMOUNT.ACTIONS.FS;
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
        }
    ],
    examples: [
        {
            description: fsStrings.EXAMPLES.EX1,
            options: "MY.FS"
        }
    ]
};
//# sourceMappingURL=fs.definition.js.map