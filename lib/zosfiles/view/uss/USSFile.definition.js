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
const View_options_1 = require("../View.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.VIEW;
/**
 * View USS file content command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.USSFileDefinition = {
    name: "uss-file",
    aliases: ["uf"],
    summary: strings.ACTIONS.USS_FILE.SUMMARY,
    description: strings.ACTIONS.USS_FILE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/USSFile.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "file",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILE,
            type: "string",
            required: true
        },
    ],
    options: [
        View_options_1.ViewOptions.binary,
        View_options_1.ViewOptions.encoding,
        View_options_1.ViewOptions.range
    ],
    examples: [
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `"/a/ibmuser/my_text.txt"`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `"/a/ibmuser/MyJavaClass.class" --binary`
        }
    ]
};
//# sourceMappingURL=USSFile.definition.js.map