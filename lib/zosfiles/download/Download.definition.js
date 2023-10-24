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
const Dataset_definition_1 = require("./ds/Dataset.definition");
const AllMembers_definition_1 = require("./am/AllMembers.definition");
const UssFile_definition_1 = require("./uss/UssFile.definition");
const DataSetMatching_definition_1 = require("./dsm/DataSetMatching.definition");
const UssDir_definition_1 = require("./ussdir/UssDir.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.DOWNLOAD;
/**
 * Download group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.DownloadDefinition = {
    name: "download",
    aliases: ["dl"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        Dataset_definition_1.DatasetDefinition,
        AllMembers_definition_1.AllMembersDefinition,
        UssFile_definition_1.UssFileDefinition,
        UssDir_definition_1.UssDirDefinition,
        DataSetMatching_definition_1.DataSetMatchingDefinition
    ]
};
//# sourceMappingURL=Download.definition.js.map