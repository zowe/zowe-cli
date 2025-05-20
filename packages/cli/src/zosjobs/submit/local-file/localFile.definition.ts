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

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).SUBMIT.ACTIONS;

import { ICommandDefinition, ICommandOptionDefinition } from "npm:@zowe/imperative";

export const LocalFileDefinition: ICommandDefinition = {
    name: "local-file",
    aliases: ["lf"],
    type: "command",
    summary: strings.LOCAL_FILE.SUMMARY,
    description: strings.LOCAL_FILE.DESCRIPTION,
    handler: __dirname + "/../Submit.shared.handler",
    positionals: [
        {
            name: "localFile",
            description: strings.LOCAL_FILE.POSITIONALS.NAME,
            type: "string",
            required: true
        }
    ],
    options: ([
        {
            name: "wait-for-active", aliases: ["wfa"],
            description: strings.COMMON_OPT.WAIT_FOR_ACTIVE,
            type: "boolean",
            conflictsWith: ["wait-for-output", "view-all-spool-content", "directory"]
        },
        {
            name: "wait-for-output", aliases: ["wfo"],
            description: strings.COMMON_OPT.WAIT_FOR_OUTPUT,
            type: "boolean"
        },
        {
            name: "view-all-spool-content", aliases: ["vasc"],
            description: strings.COMMON_OPT.VIEW_ALL_SPOOL_CONTENT,
            type: "boolean"
        },
        {
            name: "directory", aliases: ["d"],
            description: strings.COMMON_OPT.DIRECTORY,
            type: "string"
        },
        {
            name: "extension", aliases: ["e"],
            description: strings.COMMON_OPT.EXTENSION,
            type: "string"
        },
        {
            name: "jcl-symbols", aliases: ["js"],
            description: strings.COMMON_OPT.JCL_SYMBOLS,
            type: "string"
        },
        {
            name: "job-encoding", aliases: ["je"],
            description: strings.COMMON_OPT.JOB_ENCODING,
            type: "string"
        },
        {
            name: "job-record-length", aliases: ["jrl"],
            description: strings.COMMON_OPT.JOB_RECORD_LENGTH,
            type: "number",
            defaultValue: 80
        },
        {
            name: "job-record-format", aliases: ["jrf"],
            description: strings.COMMON_OPT.JOB_RECORD_FORMAT,
            type: "string",
            allowableValues: {values: ["F", "V"]},
            defaultValue: "F"
        }
    ]as ICommandOptionDefinition[]),
    profile: {
        optional: ["zosmf"]
    },
    outputFormatOptions: true,
    examples:
        [
            {
                options: strings.LOCAL_FILE.EXAMPLES.EX1.OPTIONS,
                description: strings.LOCAL_FILE.EXAMPLES.EX1.DESCRIPTION
            }
        ]
};
