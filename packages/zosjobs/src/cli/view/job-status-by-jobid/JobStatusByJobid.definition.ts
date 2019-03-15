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
import { ZosmfSession } from "../../../../../zosmf";

export const JobStatusByJobidDefinition: ICommandDefinition = {
    name: "job-status-by-jobid",
    aliases: ["jsbj"],
    type: "command",
    summary: "View status details of a z/OS job",
    description: "View status details of a single z/OS job on spool/JES queues. " +
        "The command does not prevalidate the JOBID. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints (expect for \"no jobs found\").",
    handler: __dirname + "/JobStatusByJobid.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: "The z/OS JOBID of the job you want to view." +
                " No prevalidation of the JOBID is performed.",
            type: "string",
            required: true
        }
    ],
    examples:
        [
            {
                options: "j123",
                description: "View status and other details of the job with the job ID JOB00123"
            },
            {
                options: "j123 --rff status --rft string",
                description: "Print only the status (for example, \"OUTPUT\" or \"ACTIVE\") of the job with the job ID JOB00123"
            }
        ],
    outputFormatOptions: true
};
