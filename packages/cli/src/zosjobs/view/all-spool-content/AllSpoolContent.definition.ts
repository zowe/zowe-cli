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

export const AllSpoolContentDefinition: ICommandDefinition = {
    name: "all-spool-content",
    aliases: ["asc"],
    type: "command",
    summary: "View all spool content for specified job ID",
    description: "View the contents of each spool file from a z/OS job on spool/JES queues. " +
    "The command does not pre-validate the JOBID. " +
    "The command presents errors verbatim from the z/OSMF Jobs REST endpoints.",
    handler: __dirname + "/AllSpoolContent.handler",
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
        },
    ],
    examples: [
        {
            description: "View all spool files for the job with job ID JOB00234",
            options: "JOB00234"
        }
    ]
};
