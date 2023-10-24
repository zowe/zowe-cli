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
const path = require("path");
const List_options_1 = require("../List.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.LIST.ACTIONS.FS;
/**
 * List data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.FsDefinition = {
    name: "file-system",
    aliases: ["fs"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    outputFormatOptions: true,
    handler: path.join(__dirname, "Fs.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: [
        List_options_1.ListOptions.maxLength,
        List_options_1.ListOptions.fsname,
        List_options_1.ListOptions.path
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: ""
        },
        {
            description: strings.EXAMPLES.EX2,
            options: "-p /a/ibmuser"
        },
        {
            description: strings.EXAMPLES.EX3,
            options: "-f MY.ZFS"
        }
    ]
};
//# sourceMappingURL=Fs.definition.js.map