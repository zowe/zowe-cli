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
exports.USSFileDefinition = void 0;
const List_options_1 = require("../List.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.LIST.ACTIONS.USS_FILE;
/**
 * List all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.USSFileDefinition = {
    name: "uss-files",
    aliases: ["uf", "uss"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssFile.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "path",
            description: strings.POSITIONALS.PATH,
            type: "string",
            required: true
        }
    ],
    options: [
        List_options_1.ListOptions.maxLength
    ],
    outputFormatOptions: true,
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"/u/ibmuser"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"/u/ibmuser" --rff name`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"/u/ibmuser" --rfh`
        }
    ]
};
//# sourceMappingURL=UssFile.definition.js.map