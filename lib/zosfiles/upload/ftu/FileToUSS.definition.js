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
exports.FileToUSSDefinition = void 0;
const path = require("path");
const Upload_options_1 = require("../Upload.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.UPLOAD.ACTIONS.FILE_TO_USS;
/**
 * Upload file-to-uss command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.FileToUSSDefinition = {
    name: "file-to-uss",
    aliases: ["ftu"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/FileToUSS.handler"),
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
            name: "USSFileName",
            description: strings.POSITIONALS.USSFILENAME,
            type: "string",
            required: true
        }
    ],
    options: [
        Upload_options_1.UploadOptions.binary,
        Upload_options_1.UploadOptions.encoding
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"file.txt" "/a/ibmuser/my_text.txt"`
        }
    ]
};
//# sourceMappingURL=FileToUSS.definition.js.map