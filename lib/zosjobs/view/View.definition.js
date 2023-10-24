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
exports.ViewDefinition = void 0;
const AllSpoolContent_definition_1 = require("./all-spool-content/AllSpoolContent.definition");
const JobStatusByJobid_definition_1 = require("./job-status-by-jobid/JobStatusByJobid.definition");
const SpoolFileById_definition_1 = require("./spool-file-by-id/SpoolFileById.definition");
exports.ViewDefinition = {
    name: "view",
    aliases: ["vw"],
    type: "group",
    summary: "View details of a z/OS job",
    description: "View details of z/OS jobs on spool/JES queues.",
    children: [
        AllSpoolContent_definition_1.AllSpoolContentDefinition,
        JobStatusByJobid_definition_1.JobStatusByJobidDefinition,
        SpoolFileById_definition_1.SpoolFileByIdDefinition
    ]
};
//# sourceMappingURL=View.definition.js.map