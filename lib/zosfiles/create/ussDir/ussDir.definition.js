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
exports.UssDirDefinition = void 0;
const uss_options_1 = require("../ussDir/uss.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const ussStrings = fileStrings.CREATE.ACTIONS.USSDIR;
exports.UssDirDefinition = {
    name: "uss-directory",
    aliases: ["dir"],
    summary: ussStrings.SUMMARY,
    description: ussStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/ussDir.handler",
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
            description: ussStrings.EXAMPLES.CREATE_DIRECTORY,
            options: "testDir"
        },
        {
            description: ussStrings.EXAMPLES.SPECIFY_MODE,
            options: "testDir -m rwxrwxrwx"
        }
    ]
};
//# sourceMappingURL=ussDir.definition.js.map