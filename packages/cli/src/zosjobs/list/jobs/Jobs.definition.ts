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

export const JobsDefinition: ICommandDefinition = {
    name: "jobs",
    aliases: ["js"],
    summary: "List z/OS jobs on JES spool/queues",
    description: "List jobs on JES spool/queues. " +
        "By default, the command lists jobs owned (owner) by the user specified in your z/OSMF profile." +
        " The default for prefix is \"*\". " +
        "The command does not prevalidate your user ID. " +
        "The command surfaces errors verbatim from the z/OSMF Jobs REST endpoints.",
    type: "command",
    handler: __dirname + "/Jobs.handler",
    options: ([
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
            name: "exec-data", aliases: ["ed"],
            description: "Use this option to retrieve execution data for jobs via the z/OSMF REST API.",
            type: "boolean",
            default: false
        }
    ] as ICommandOptionDefinition[]),
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
            },
            {
                options: "--exec-data",
                description: "List all jobs and return job execution data along with the default information"
            },
            {
                options: "-o \"ibmu*\" --exec-data",
                description: "List all jobs owned by user IDs starting with 'ibmu' and return job execution data along with the default information"
            },
            {
                options: "-o \"ibmu*\" -p \"myjo*\" --exec-data",
                description: "List all jobs owned by user IDs starting with 'ibmu' and job names starting with 'myjo' and " +
                    "return job execution data along with the default information"
            }
        ],
    outputFormatOptions: true
};