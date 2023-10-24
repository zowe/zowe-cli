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
exports.DsDefinition = void 0;
const path_1 = require("path");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.COPY.ACTIONS.DATA_SET;
/**
 * This object defines the command for copy data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @type {ICommandDefinition}
 */
exports.DsDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: (0, path_1.join)(__dirname, "Ds.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fromDataSetName",
            type: "string",
            description: strings.POSITIONALS.FROMDSNAME,
            required: true
        },
        {
            name: "toDataSetName",
            type: "string",
            description: strings.POSITIONALS.TODSNAME,
            required: true
        }
    ],
    options: [
        {
            name: "replace",
            aliases: ["rep"],
            description: strings.OPTIONS.REPLACE,
            type: "boolean"
        }
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"USER.FROM.SET" "USER.TO.SET"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET(mem2)"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"USER.FROM.SET" "USER.TO.SET(mem2)"`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET"`
        },
        {
            description: strings.EXAMPLES.EX5,
            options: `"USER.FROM.SET" "USER.TO.SET" --replace`
        }
    ]
};
//# sourceMappingURL=Ds.definition.js.map