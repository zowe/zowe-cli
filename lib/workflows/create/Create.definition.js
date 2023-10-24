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
exports.CreateDefinition = void 0;
const Dataset_definition_1 = require("./dataset/Dataset.definition");
const UssFile_definition_1 = require("./ussfile/UssFile.definition");
const LocalFile_definition_1 = require("./localfile/LocalFile.definition");
/**
 * This object defines the command for the create group within zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
exports.CreateDefinition = {
    name: "create",
    aliases: ["cre"],
    type: "group",
    description: "Create a z/OSMF workflow on a z/OS system.",
    children: [
        Dataset_definition_1.DataSet,
        UssFile_definition_1.UssFile,
        LocalFile_definition_1.LocalFile
    ]
};
//# sourceMappingURL=Create.definition.js.map