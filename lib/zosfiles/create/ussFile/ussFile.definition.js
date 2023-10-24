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
exports.UssFileDefinition = void 0;
const uss_options_1 = require("./uss.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const ussStrings = fileStrings.CREATE.ACTIONS.USSFILE;
exports.UssFileDefinition = {
    name: "uss-file",
    aliases: ["file"],
    summary: ussStrings.SUMMARY,
    description: ussStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/ussFile.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "ussPath",
            type: "string",
            description: ussStrings.POSITIONALS.PATH,
            required: true
        }
    ],
    options: [
        uss_options_1.UssCreateOptions.mode
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: ussStrings.EXAMPLES.CREATE_FILE,
            options: "text.txt"
        },
        {
            description: ussStrings.EXAMPLES.SPECIFY_MODE,
            options: "text.txt -m rwxrwxrwx"
        }
    ]
};
//# sourceMappingURL=ussFile.definition.js.map