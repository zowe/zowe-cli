/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import { Constants } from "../../../../../Constants";
import { ZosmfSession } from "../../../../../zosmf";

export const SpoolFileByIdDefinition: ICommandDefinition = {
    name: "spool-file-by-id",
    aliases: ["sfbi"],
    type: "command",
    summary: "View a spool file from a z/OS job",
    description: "View the contents of a spool file from a z/OS job on spool/JES queues. " +
        "The command does not pre-validate the JOBID or spool ID. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints.",
    handler: __dirname + "/SpoolFileById.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: "The z/OS JOBID of the job containing the spool file you want to view. " +
                "No pre-validation of the JOBID is performed.",
            type: "string",
            required: true
        },
        {
            name: "spoolfileid",
            description: "The spool file ID number for the spool file to view. " +
                `Use the "${Constants.BINARY_NAME} zos-jobs list spool-files-by-jobid" command to obtain spool ID numbers.` +
                "No pre-validation of the ID is performed.",
            type: "number",
            required: true
        }
    ],
    examples: [
        {
            description: "View the spool file with ID 4 for the job with job ID JOB00123",
            options: "JOB00123 4"
        }
    ]
};
