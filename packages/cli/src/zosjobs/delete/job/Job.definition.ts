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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";
import { ZosJobsOptions } from "../../ZosJobs.options";
import i18nTypings from "../../-strings-/en";

const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE;

export const JobDefinition: ICommandDefinition = {
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
    options:  [ZosJobsOptions.modifyVersion],
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
