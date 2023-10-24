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
exports.FileToDataSetDefinition = void 0;
const path = require("path");
const Upload_options_1 = require("../Upload.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.UPLOAD.ACTIONS.FILE_TO_DATA_SET;
/**
 * Upload file-to-data-set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.FileToDataSetDefinition = {
    name: "file-to-data-set",
    aliases: ["ftds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/FileToDataSet.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "inputfile",
            description: strings.POSITIONALS.INPUTFILE,
            type: "string",
            required: true
        },
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        Upload_options_1.UploadOptions.volume,
        Upload_options_1.UploadOptions.binary,
        Upload_options_1.UploadOptions.record,
        Upload_options_1.UploadOptions.recall,
        Upload_options_1.UploadOptions.encoding
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"file.txt" "ibmuser.ps"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"file.txt" "ibmuser.pds(mem)"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"file.txt" "ibmuser.ps" --mr wait`
        }
    ]
};
//# sourceMappingURL=FileToDataSet.definition.js.map