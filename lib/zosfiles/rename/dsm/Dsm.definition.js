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
exports.DsmDefinition = void 0;
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default;
const dsmStrings = strings.RENAME.ACTIONS.DATA_SET_MEMBER;
exports.DsmDefinition = {
    name: "data-set-member",
    aliases: ["dsm"],
    description: dsmStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Dsm.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: dsmStrings.POSITIONALS.DSNAME,
            required: true
        },
        {
            name: "beforeMemberName",
            type: "string",
            description: dsmStrings.POSITIONALS.BEFOREMEMBERNAME,
            required: true
        },
        {
            name: "afterMemberName",
            type: "string",
            description: dsmStrings.POSITIONALS.AFTERMEMBERNAME,
            required: true
        }
    ],
    examples: [
        {
            description: dsmStrings.EXAMPLES.EX1,
            options: '"USER.DATA.SET" "MEM1" "MEM2'
        }
    ]
};
//# sourceMappingURL=Dsm.definition.js.map