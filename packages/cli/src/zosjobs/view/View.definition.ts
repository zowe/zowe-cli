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
import { InteractiveJobsDefinition } from "./interactive-jobs/InteractiveJobs.definition";
import { JobStatusByJobidDefinition } from "./job-status-by-jobid/JobStatusByJobid.definition";
import { SpoolFileByIdDefinition } from "./spool-file-by-id/SpoolFileById.definition";

export const ViewDefinition: ICommandDefinition = {
    name: "view",
    aliases: ["vw"],
    type: "group",
    summary: "View details of a z/OS job",
    description: "View details of z/OS jobs on spool/JES queues.",
    children: [
        JobStatusByJobidDefinition,
        SpoolFileByIdDefinition,
        InteractiveJobsDefinition,
    ]
};
