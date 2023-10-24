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
exports.DataSetMatchingDefinition = void 0;
const Download_options_1 = require("../Download.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.DOWNLOAD.ACTIONS.DATA_SETS_MATCHING;
/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.DataSetMatchingDefinition = {
    name: "data-sets-matching",
    aliases: ["dsm", "data-set-matching"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/DataSetMatching.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "pattern",
            description: strings.POSITIONALS.PATTERN,
            type: "string",
            required: true
        }
    ],
    options: [
        Download_options_1.DownloadOptions.volume,
        Download_options_1.DownloadOptions.directory,
        Download_options_1.DownloadOptions.binary,
        Download_options_1.DownloadOptions.record,
        Download_options_1.DownloadOptions.encoding,
        Download_options_1.DownloadOptions.extension,
        Download_options_1.DownloadOptions.excludePattern,
        Download_options_1.DownloadOptions.extensionMap,
        Download_options_1.DownloadOptions.maxConcurrentRequests,
        Download_options_1.DownloadOptions.preserveOriginalLetterCase,
        Download_options_1.DownloadOptions.failFast
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.**.cntl, ibmuser.**.jcl" --directory jcl --extension .jcl`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.public.project.*, ibmuser.project.private.*" --exclude-patterns "ibmuser.public.**.*lib" ` +
                `--directory project --extension-map cpgm=c,asmpgm=asm,java=java,chdr=c,jcl=jcl,cntl=jcl`
        }
    ]
};
//# sourceMappingURL=DataSetMatching.definition.js.map