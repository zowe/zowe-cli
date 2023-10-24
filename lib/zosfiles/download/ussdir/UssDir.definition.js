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
exports.UssDirDefinition = void 0;
const Download_options_1 = require("../Download.options");
const List_options_1 = require("../../list/List.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.DOWNLOAD.ACTIONS.USS_DIR;
/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.UssDirDefinition = {
    name: "uss-directory",
    aliases: ["uss-dir"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssDir.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "ussDirName",
            description: strings.POSITIONALS.USSDIRNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        Download_options_1.DownloadOptions.attributes,
        Download_options_1.DownloadOptions.directoryUss,
        Download_options_1.DownloadOptions.binary,
        Download_options_1.DownloadOptions.encoding,
        Download_options_1.DownloadOptions.maxConcurrentRequestsUss,
        Download_options_1.DownloadOptions.failFastUss,
        Download_options_1.DownloadOptions.includeHidden,
        Download_options_1.DownloadOptions.overwrite,
        List_options_1.ListOptions.name,
        List_options_1.ListOptions.maxLength,
        List_options_1.ListOptions.group,
        List_options_1.ListOptions.owner,
        List_options_1.ListOptions.mtime,
        List_options_1.ListOptions.size,
        List_options_1.ListOptions.perm,
        List_options_1.ListOptions.type,
        List_options_1.ListOptions.depth,
        List_options_1.ListOptions.filesys,
        List_options_1.ListOptions.symlinks
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `/a/ibmuser --binary`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `/a/ibmuser --directory localDir`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `/a/ibmuser --name "*.log" --mtime -1`
        }
    ]
};
//# sourceMappingURL=UssDir.definition.js.map