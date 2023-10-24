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
exports.CancelDefinition = void 0;
const Job_definition_1 = require("./job/Job.definition");
const strings = require("../-strings-/en").default.CANCEL;
exports.CancelDefinition = {
    name: "cancel",
    aliases: ["can"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        Job_definition_1.JobDefinition
    ]
};
//# sourceMappingURL=Cancel.definition.js.map