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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";
import i18nTypings from "../-strings-/en";
const strings = (require("../-strings-/en").default as typeof i18nTypings);

export const InteractDefinition: ICommandDefinition = {
    name: "interact",
    aliases: ["it"],
    type: "command",
    summary: "View Jobs Interactively",
    description: "Interactively select jobs and spool files to view them.",
    handler: __dirname + "/Interact.handler",
    positionals: [],
    options: [
        {
            name: "owner", aliases: ["o"],
            description: "Specify the owner of the jobs you want to list. " +
                "The owner is the individual/user who submitted the job OR the user ID assigned to the job. " +
                "The command does not prevalidate the owner. " +
                "You can specify a wildcard according to the z/OSMF Jobs REST endpoint documentation, " +
                "which is usually in the form \"USER*\".",
            type: "string"
        },
        {
            name: "prefix", aliases: ["p"],
            description: "Specify the job name prefix of the jobs you want to list. " +
                "The command does not prevalidate the owner. " +
                "You can specify a wildcard according to the z/OSMF Jobs REST endpoint documentation, " +
                "which is usually in the form \"JOB*\".",
            type: "string"
        },
        {
            name: "modifyVersion",
            description: strings.DELETE.ACTIONS.JOB.OPTIONS.MODIFY_VERSION,
            type: "string",
            hidden: true,
            required: false,
            defaultValue: "1.0"
        },
        {
            name: "directory",
            aliases: ["d", "dir"],
            hidden: true,
            description: "The local directory you would like to download the output for the job to.",
            type: "string"
        },
        {
            name: "extension",
            aliases: ["e"],
            hidden: true,
            description: "A file extension to save the job output with. Defaults to '.txt'.",
            type: "string"
        },
        {
            name: "omit-jobid-directory",
            aliases: ["ojd"],
            hidden: true,
            description: "If specified, job output will be saved directly to the specified " +
                "directory rather than creating a subdirectory named after the ID of the job.",
            type: "boolean"
        },
    ] as ICommandOptionDefinition[],
    profile: {
        optional: ["zosmf"]
    },
    examples:
        [
            {
                options: "",
                description: "List all jobs with default settings." +
                    " The command returns jobs owned by your user ID with any job name"
            },
            {
                options: "-o \"ibmu*\" -p \"myjo*\"",
                description: "List all jobs owned by user IDs starting with 'ibmu' and job names starting with 'myjo'"
            },
            {
                options: "--rff jobid --rft table",
                description: "List all jobs with default owner and prefix settings, displaying only the job ID of each job"
            }
        ],
    outputFormatOptions: true
};
