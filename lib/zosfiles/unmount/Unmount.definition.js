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
exports.UnmountDefinition = void 0;
const fs_definition_1 = require("./fs/fs.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.UNMOUNT;
/**
 * Download group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.UnmountDefinition = {
    name: "unmount",
    aliases: ["umount"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        fs_definition_1.FsDefinition
    ]
};
//# sourceMappingURL=Unmount.definition.js.map