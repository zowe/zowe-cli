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
import { ZosJobsOptions } from "../../ZosJobs.options";

import i18nTypings from "../../-strings-/en";

const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE;

export const OldJobsDefinition: ICommandDefinition = {
    name: "old-jobs",
    aliases: ["oj"],
    type: "command",
    summary: strings.ACTIONS.OLD_JOBS.SUMMARY,
    description: strings.ACTIONS.OLD_JOBS.DESCRIPTION,
    handler: __dirname + "/OldJobs.handler",
    profile: {
        optional: ["zosmf"]
    },
    options: [
        {
            name: "prefix",
            aliases: ["p"],
            description: strings.ACTIONS.OLD_JOBS.OPTIONS.PREFIX,
            type: "string"
        },
        {
            name: "max-concurrent-requests",
            aliases: ["mcr"],
            description: strings.ACTIONS.OLD_JOBS.OPTIONS.MAX_CONCURRENT_REQUESTS,
            type: "number",
            defaultValue: 1
        },
        ZosJobsOptions.modifyVersion,
    ],
    examples: [
        {
            description: strings.ACTIONS.OLD_JOBS.EXAMPLES.EX1.DESCRIPTION,
            options: strings.ACTIONS.OLD_JOBS.EXAMPLES.EX1.OPTIONS
        }
    ]
};
