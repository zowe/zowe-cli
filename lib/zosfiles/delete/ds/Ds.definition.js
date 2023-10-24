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
const strings = require("../../-strings-/en").default.DELETE.ACTIONS.DATA_SET;
/**
 * This object defines the command for delete data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
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
            name: "dataSetName",
            type: "string",
            description: strings.POSITIONALS.DSNAME,
            required: true
        }
    ],
    options: [
        {
            name: "for-sure",
            aliases: ["f"],
            description: strings.OPTIONS.FOR_SURE,
            type: "boolean",
            required: true
        },
        {
            name: "volume",
            aliases: ["vol"],
            description: strings.OPTIONS.VOLUME,
            type: "string"
        }
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.cntl" -f`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.cntl(mem)" -f`
        }
    ]
};
//# sourceMappingURL=Ds.definition.js.map