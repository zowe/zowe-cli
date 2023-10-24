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
const strings = require("../../-strings-/en").default.MODIFY;
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
        },
    ],
    options: [
        {
            name: "jobclass",
            description: strings.ACTIONS.JOB.OPTIONS.JOB_CLASS,
            type: "string",
            defaultValue: undefined,
            required: false,
        },
        {
            name: "hold",
            description: strings.ACTIONS.JOB.OPTIONS.HOLD,
            type: "boolean",
            defaultValue: undefined,
            required: false,
            conflictsWith: ["release"]
        },
        {
            name: "release",
            description: strings.ACTIONS.JOB.OPTIONS.RELEASE,
            type: "boolean",
            defaultValue: undefined,
            required: false,
        }
    ],
    examples: Object.values(strings.ACTIONS.JOB.EXAMPLES).map((item) => ({
        description: item.DESCRIPTION,
        options: item.OPTIONS
    }))
};
//# sourceMappingURL=Job.definition.js.map