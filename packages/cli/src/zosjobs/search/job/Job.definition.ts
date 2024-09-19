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

const strings = (require("../../-strings-/en").default as typeof i18nTypings).SEARCH;

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
            description: strings.ACTIONS.JOB.POSITIONALS.JOBNAME,
            type: "string",
            required: true
        },
    ],
    options: [
        {
            name: "search-string",
            aliases: ["string"],
            description: strings.ACTIONS.JOB.OPTIONS.SEARCHSTRING,
            type: "string",
            defaultValue: undefined,
            required: false
        },
        {
            name: "search-regex",
            aliases: ["regex"],
            description: strings.ACTIONS.JOB.OPTIONS.SEARCHREGEX,
            type: "string",
            defaultValue: undefined,
            required: false
        },
        {
            name: "case-insensitive",
            aliases: ["ci"],
            description: strings.ACTIONS.JOB.OPTIONS.CASEINSENSITIVE,
            type: "boolean",
            defaultValue: true,
            required: false
        },
        {
            name: "search-limit",
            aliases: ["sl"],
            description: strings.ACTIONS.JOB.OPTIONS.SEARCHLIMIT,
            type: "number",
            defaultValue: 100,
            required: false
        },
        {
            name: "file-limit",
            aliases: ["fl"],
            description: strings.ACTIONS.JOB.OPTIONS.FILELIMIT,
            type: "number",
            defaultValue: 100,
            required: false
        }
    ],
    examples: Object.values(strings.ACTIONS.JOB.EXAMPLES).map((item: any) => ({
        description: item.DESCRIPTION,
        options: item.OPTIONS
    }))
};
