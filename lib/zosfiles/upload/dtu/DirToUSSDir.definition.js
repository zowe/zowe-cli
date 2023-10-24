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
exports.DirToUSSDirDefinition = void 0;
const path = require("path");
const Upload_options_1 = require("../Upload.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.UPLOAD.ACTIONS.DIR_TO_USS;
/**
 * Upload dir-to-uss command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.DirToUSSDirDefinition = {
    name: "dir-to-uss",
    aliases: ["dtu"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/DirToUSSDir.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "inputDir",
            description: strings.POSITIONALS.INPUTDIR,
            type: "string",
            required: true
        },
        {
            name: "USSDir",
            description: strings.POSITIONALS.USSDIR,
            type: "string",
            required: true
        }
    ],
    options: [
        Upload_options_1.UploadOptions.binary,
        Upload_options_1.UploadOptions.recursive,
        Upload_options_1.UploadOptions.binaryFiles,
        Upload_options_1.UploadOptions.asciiFiles,
        Upload_options_1.UploadOptions.attributes,
        Upload_options_1.UploadOptions.maxConcurrentRequests,
        Upload_options_1.UploadOptions.includeHidden
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"local_dir" "/a/ibmuser/my_dir"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"local_dir" "/a/ibmuser/my_dir" --recursive`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"local_dir" "/a/ibmuser/my_dir" --binary-files "myFile1.exe,myFile2.exe,myFile3.exe"`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"local_dir" "/a/ibmuser/my_dir" --binary --ascii-files "myFile1.txt,myFile2.txt,myFile3.txt"`
        },
        {
            description: strings.EXAMPLES.EX5,
            options: `"local_dir" "/a/ibmuser/my_dir" --recursive --attributes my_global_attributes`
        }
    ]
};
//# sourceMappingURL=DirToUSSDir.definition.js.map