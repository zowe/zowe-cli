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
exports.ListDefinition = void 0;
const SpoolFilesByJobid_definition_1 = require("./spool-files-by-jobid/SpoolFilesByJobid.definition");
const Jobs_definition_1 = require("./jobs/Jobs.definition");
exports.ListDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: "List jobs and spool files",
    description: "List z/OS jobs and list the spool files (DDs) for a z/OS job on the JES/spool queues.",
    children: [SpoolFilesByJobid_definition_1.SpoolFilesByJobidDefinition,
        Jobs_definition_1.JobsDefinition]
};
//# sourceMappingURL=List.definition.js.map