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
import { JobDefinition } from "./job/Job.definition";

export const DeleteDefinition: ICommandDefinition = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    summary: "Delete a job or jobs",
    description: "Delete a single job by job ID or delete multiple jobs in OUTPUT status." +
                " This cancels the job if it is running and purges its output from the system",
    children: [
        JobDefinition,
    ],
};
