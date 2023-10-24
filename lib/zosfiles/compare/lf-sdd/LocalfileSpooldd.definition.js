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
exports.LocalfileSpoolddDefinition = void 0;
const Compare_options_1 = require("../Compare.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.COMPARE;
/**
 * Compare local-file-spool-dd command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.LocalfileSpoolddDefinition = {
    name: "local-file-spool-dd",
    aliases: ["lf-sdd"],
    summary: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.SUMMARY,
    description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.DESCRIPTION,
    type: "command",
    handler: __dirname + "/LocalfileSpooldd.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "localFilePath",
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.POSITIONALS.LOCALFILEPATH,
            type: "string",
            required: true
        },
        {
            name: "spoolDescription",
            type: "string",
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.POSITIONALS.SPOOLDDDESCRIPTION,
            required: true
        }
    ],
    options: [
        Compare_options_1.CompareOptions.seqnum,
        Compare_options_1.CompareOptions.contextLines,
        Compare_options_1.CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.EXAMPLES.EX1,
            options: `"./a.txt" "jobName:jobId:spoolId"`
        },
        {
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.EXAMPLES.EX2,
            options: `"./a.txt" "jobName:jobId:spoolId" --no-seqnum`
        }
    ]
};
//# sourceMappingURL=LocalfileSpooldd.definition.js.map