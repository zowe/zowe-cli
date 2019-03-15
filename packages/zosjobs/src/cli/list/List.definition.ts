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
import { SpoolFilesByJobidDefinition } from "./spool-files-by-jobid/SpoolFilesByJobid.definition";
import { JobsDefinition } from "./jobs/Jobs.definition";

export const ListDefinition: ICommandDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: "List jobs and spool files",
    description: "List z/OS jobs and list the spool files (DDs) for a z/OS job on the JES/spool queues.",
    children: [SpoolFilesByJobidDefinition,
        JobsDefinition]
};
