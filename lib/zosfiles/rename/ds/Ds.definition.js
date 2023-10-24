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
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default;
const dsStrings = strings.RENAME.ACTIONS.DATA_SET;
exports.DsDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: dsStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Ds.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "beforeDataSetName",
            type: "string",
            description: dsStrings.POSITIONALS.BEFOREDSNAME,
            required: true
        },
        {
            name: "afterDataSetName",
            type: "string",
            description: dsStrings.POSITIONALS.AFTERDSNAME,
            required: true
        }
    ],
    examples: [
        {
            description: dsStrings.EXAMPLES.EX1,
            options: '"USER.BEFORE.SET" "USER.AFTER.SET"'
        }
    ]
};
//# sourceMappingURL=Ds.definition.js.map