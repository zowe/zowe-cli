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
exports.DownloadDefinition = void 0;
const Output_definition_1 = require("./download-output/Output.definition");
exports.DownloadDefinition = {
    name: "download",
    aliases: ["dl"],
    type: "group",
    summary: "Download job output",
    description: "Download the output of a job as separate files.",
    children: [
        Output_definition_1.OutputDefinition
    ]
};
//# sourceMappingURL=Download.definition.js.map