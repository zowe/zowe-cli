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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";

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
            name: "view-all-spool-content", aliases: ["vasc"],
            description: strings.LOCAL_FILE.OPTIONS.VIEW_ALL_SPOOL_CONTENT,
            type: "boolean"
        },
        {
            name: "wait-for-output", aliases: ["wfo"],
            description: strings.LOCAL_FILE.OPTIONS.WAIT_FOR_OUTPUT,

            type: "boolean"
        },
        {
            name: "wait-for-active", aliases: ["wfa"],
            description: strings.LOCAL_FILE.OPTIONS.WAIT_FOR_ACTIVE,
            type: "boolean",
            conflictsWith: ["wait-for-output", "view-all-spool-content", "directory"]
        },
        {
            name: "directory", aliases: ["d"],
            description: strings.LOCAL_FILE.OPTIONS.DIRECTORY,
            type: "string"
        },
        {
            name: "extension", aliases: ["e"],
            description: strings.LOCAL_FILE.OPTIONS.EXTENSION,
            type: "string"
        },
        {
            name: "jcl-symbols", aliases: ["js"],
            description: strings.COMMON.JCL_SYMBOLS_OPT,
            type: "string"
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
