"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpoolFilesByJobidDefinition = void 0;
exports.SpoolFilesByJobidDefinition = {
    name: "spool-files-by-jobid",
    aliases: ["sfbj"],
    type: "command",
    summary: "List spool files of a z/OS job",
    description: "Given a z/OS job JOBID, list the spool files (DDs) for a z/OS job on the JES/spool queues. " +
        "The command does not pre-validate the JOBID. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints.",
    handler: __dirname + "/SpoolFilesByJobid.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "jobid",
            description: "The z/OS JOBID of the job with the spool files you want to list. " +
                "No pre-validation of the JOBID is performed.",
            type: "string",
            required: true
        }
    ],
    outputFormatOptions: true,
    examples: [
        {
            options: "job00123",
            description: "List the spool files of the job with JOBID JOB00123"
        }
    ]
};
//# sourceMappingURL=SpoolFilesByJobid.definition.js.map