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

import { ICommandDefinition } from "@zowe/imperative";

import i18nTypings from "../../-strings-/en";

const strings = (require("../../-strings-/en").default as typeof i18nTypings).MODIFY;

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
            name: "jobname",
            description: strings.ACTIONS.JOB.POSITIONALS.JOB_NAME,
            type: "string",
            required: true
        },
        {
            name: "jobid",
            description: strings.ACTIONS.JOB.POSITIONALS.JOB_ID,
            type: "string",
            required: true
        },
    ],
    options: [
        {
            name: "job-class",
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
        },
        {
            name: "show-job",
            description: strings.ACTIONS.JOB.OPTIONS.SHOW_JOB,
            type: "boolean",
            defaultValue: false,
            required: false,
        }
    ],
    examples: [
        {
            description: strings.ACTIONS.JOB.EXAMPLES.EX1.DESCRIPTION,
            options: strings.ACTIONS.JOB.EXAMPLES.EX1.OPTIONS
        }
    ]
};
