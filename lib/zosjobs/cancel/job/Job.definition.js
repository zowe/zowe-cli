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
exports.JobDefinition = void 0;
const ZosJobs_options_1 = require("../../ZosJobs.options");
const strings = require("../../-strings-/en").default.CANCEL;
exports.JobDefinition = {
    name: "job",
    type: "command",
    summary: strings.ACTIONS.JOB.SUMMARY,
    description: strings.ACTIONS.JOB.DESCRIPTION,
    handler: __dirname + "/Job.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: strings.ACTIONS.JOB.POSITIONALS.JOB_ID,
            type: "string",
            required: true
        }
    ],
    options: [ZosJobs_options_1.ZosJobsOptions.modifyVersion],
    examples: [
        {
            description: strings.ACTIONS.JOB.EXAMPLES.EX1.DESCRIPTION,
            options: strings.ACTIONS.JOB.EXAMPLES.EX1.OPTIONS
        },
        {
            description: strings.ACTIONS.JOB.EXAMPLES.EX2.DESCRIPTION,
            options: strings.ACTIONS.JOB.EXAMPLES.EX2.OPTIONS
        }
    ]
};
//# sourceMappingURL=Job.definition.js.map