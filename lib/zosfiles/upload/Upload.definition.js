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
exports.UploadDefinition = void 0;
const FileToDataSet_definition_1 = require("./ftds/FileToDataSet.definition");
const StdinToDataSet_definition_1 = require("./stds/StdinToDataSet.definition");
const DirToPds_definition_1 = require("./dtp/DirToPds.definition");
const FileToUSS_definition_1 = require("./ftu/FileToUSS.definition");
const DirToUSSDir_definition_1 = require("./dtu/DirToUSSDir.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.UPLOAD;
/**
 * Upload group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.UploadDefinition = {
    name: "upload",
    aliases: ["ul"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        FileToDataSet_definition_1.FileToDataSetDefinition,
        StdinToDataSet_definition_1.StdinToDataSetDefinition,
        DirToPds_definition_1.DirToPdsDefinition,
        FileToUSS_definition_1.FileToUSSDefinition,
        DirToUSSDir_definition_1.DirToUSSDirDefinition
    ]
};
//# sourceMappingURL=Upload.definition.js.map