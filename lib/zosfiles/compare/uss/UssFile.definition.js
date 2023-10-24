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
const Compare_options_1 = require("../Compare.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.COMPARE;
/**
 * Compare uss-files command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.UssFileDefinition = {
    name: "uss-files",
    aliases: ["uss", "uf"],
    summary: strings.ACTIONS.USS_FILE.SUMMARY,
    description: strings.ACTIONS.USS_FILE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssFile.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "ussFilePath1",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILEPATH1,
            type: "string",
            required: true
        },
        {
            name: "ussFilePath2",
            type: "string",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILEPATH2,
            required: true
        }
    ],
    options: [
        Compare_options_1.CompareOptions.binary,
        Compare_options_1.CompareOptions.binary2,
        Compare_options_1.CompareOptions.encoding,
        Compare_options_1.CompareOptions.encoding2,
        Compare_options_1.CompareOptions.seqnum,
        Compare_options_1.CompareOptions.contextLines,
        Compare_options_1.CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `"/u/user/test.txt" "/u/user/test.txt"`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `"/u/user/test.txt" "/u/user/test.txt" --no-seqnum`
        }
    ]
};
//# sourceMappingURL=UssFile.definition.js.map