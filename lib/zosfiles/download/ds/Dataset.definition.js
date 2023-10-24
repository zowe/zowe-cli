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
exports.DatasetDefinition = void 0;
const Download_options_1 = require("../Download.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.DOWNLOAD.ACTIONS.DATA_SET;
/**
 * Download data set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.DatasetDefinition = {
    name: "data-set",
    aliases: ["ds"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Dataset.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        Download_options_1.DownloadOptions.volume,
        Download_options_1.DownloadOptions.file,
        Download_options_1.DownloadOptions.extension,
        Download_options_1.DownloadOptions.binary,
        Download_options_1.DownloadOptions.record,
        Download_options_1.DownloadOptions.preserveOriginalLetterCase,
        Download_options_1.DownloadOptions.encoding
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.loadlib(main)" -b -f main.obj`
        }
    ]
};
//# sourceMappingURL=Dataset.definition.js.map