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

export const JobDefinition: ICommandDefinition = {
    name: "job",
    type: "command",
    summary: "Delete a single job by job ID",
    description: "Delete a single job by job ID",
    handler: __dirname + "/Job.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: "The job ID (e.g. JOB00123) of the job. Job ID is a unique identifier for z/OS batch jobs " +
                "-- no two jobs on one system can have the same ID. Note: z/OS allows you to abbreviate " +
                "the job ID if desired. You can use, for example \"J123\".",
            type: "string",
            required: true
        }
    ],
    options: [
        {
            name: "modifyVersion",
            description: "If you use this option, X-IBM-Job-Modify-Version will be set to \"2.0\" and delete job API will be synchronous. " +
            "Otherwise, it will be asynchronous.",
            type: "boolean",
            required: false
        }
    ],
    examples: [
        {
            description: "Delete job with job ID JOB03456.",
            options: "JOB03456"
        }
    ]
};
