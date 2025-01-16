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

export const OutputDefinition: ICommandDefinition = {
    name: "output",
    aliases: ["o"],
    type: "command",
    summary: "Download all job output to a directory",
    description: "Download all job output to a local directory. " +
        "Each spool DD will be downloaded to its own file in the directory.",
    handler: __dirname + "/Output.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: "The z/OS JOBID of the job containing the spool files you want to view. " +
            "No pre-validation of the JOBID is performed.",
            type: "string",
            required: true
        }
    ],
    options: ([
        {
            name: "directory",
            aliases: ["d", "dir"],
            description: "The local directory you would like to download the output for the job to.",
            type: "string"
        },
        {
            name: "extension",
            aliases: ["e"],
            description: "A file extension to save the job output with. Defaults to '.txt'.",
            type: "string"
        },
        {
            name: "omit-jobid-directory",
            aliases: ["ojd"],
            description: "If specified, job output will be saved directly to the specified " +
                "directory rather than creating a subdirectory named after the ID of the job.",
            type: "boolean"
        },
        {
            name: "binary",
            aliases: ["b"],
            description: "If specified, job output will be downloaded in binary format instead " +
                "of performing text conversion. Conflicts with record.",
            type: "boolean"
        },
        {
            name: "record",
            aliases: ["r"],
            description: "If specified, job output will be downloaded in record format instead " +
                "of performing text conversion. Conflicts with binary.",
            type: "boolean",
            conflictsWith: ["binary"]
        },
        {
            name: "encoding",
            aliases: ["ec"],
            description: "Download the spool file content with encoding mode, which means that " +
                "data conversion is performed using the file encoding specified.",
            type: "string",
            conflictsWith: ["binary", "record"]
        },
        {
            name: "wait-for-active", aliases: ["wfa"],
            description: "Wait for the job to enter ACTIVE status before completing the command.",
            type: "boolean",
            conflictsWith: ["wait-for-output"]
        },
        {
            name: "wait-for-output", aliases: ["wfo"],
            description: "Wait for the job to enter OUTPUT status before completing the command.",
            type: "boolean",
            conflictsWith: ["wait-for-active"]
        },
        {
            name: "record-range",
            aliases: ["rr"],
            description: "Zero indexed range of records to download from a spool file. (example: 0-100)",
            type: "string",
            optional: true
        }
    ] as ICommandOptionDefinition[]),
    examples: [
        {
            description: "Download all the output of the job with job ID JOB00234 to an automatically generated directory.",
            options: "JOB00234"
        }
    ]
};
