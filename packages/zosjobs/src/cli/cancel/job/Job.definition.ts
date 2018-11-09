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

import { ICommandDefinition } from "@brightside/imperative";
import { ZosmfSession } from "../../../../../zosmf";

export const JobDefinition: ICommandDefinition = {
    name: "job",
    type: "command",
    summary: "Cancel a single job by job ID",
    description: "Cancel a single job by job ID",
    handler: __dirname + "/Job.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "jobid",
            description: "The job ID (e.g. JOB00123) of the job. Job ID is a unique identifier for z/OS batch jobs " +
                "-- no two jobs on one system can have the same ID. Note: z/OS allows you to abbreviate " +
                "the job ID if desired. You can use, for example \"J123\".",
            type: "string",
            required: true
        },
    ],
    examples: [
        {
            description: "Cancel job with job ID JOB03456",
            options: "JOB03456",
        },
    ],
};
