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
exports.StdinToDataSetDefinition = void 0;
const path = require("path");
const Upload_options_1 = require("../Upload.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.UPLOAD.ACTIONS.STDIN_TO_DATA_SET;
/**
 * Upload stdin-to-data-set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.StdinToDataSetDefinition = {
    name: "stdin-to-data-set",
    aliases: ["stds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/StdinToDataSet.handler"),
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
        Upload_options_1.UploadOptions.volume,
        Upload_options_1.UploadOptions.binary,
        Upload_options_1.UploadOptions.record,
        Upload_options_1.UploadOptions.recall
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.ps"`,
            prefix: `echo "hello world" |`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.pds(mem)"`,
            prefix: `echo "hello world" |`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"ibmuser.ps" --mr wait`,
            prefix: `echo "hello world" |`
        }
    ]
};
//# sourceMappingURL=StdinToDataSet.definition.js.map