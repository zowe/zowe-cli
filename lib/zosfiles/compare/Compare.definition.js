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
exports.CompareDefinition = void 0;
const Dataset_definition_1 = require("./ds/Dataset.definition");
const LocalfileDataset_definition_1 = require("./lf-ds/LocalfileDataset.definition");
const UssFile_definition_1 = require("./uss/UssFile.definition");
const LocalfileUss_definition_1 = require("./lf-uss/LocalfileUss.definition");
const Spooldd_definition_1 = require("./sdd/Spooldd.definition");
const LocalfileSpooldd_definition_1 = require("./lf-sdd/LocalfileSpooldd.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.COMPARE;
/**
 * Compare group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.CompareDefinition = {
    name: "compare",
    aliases: ["cmp"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        Dataset_definition_1.DatasetDefinition,
        LocalfileDataset_definition_1.LocalfileDatasetDefinition,
        UssFile_definition_1.UssFileDefinition,
        LocalfileUss_definition_1.LocalfileUssFileDefinition,
        Spooldd_definition_1.SpoolddDefinition,
        LocalfileSpooldd_definition_1.LocalfileSpoolddDefinition
    ],
};
//# sourceMappingURL=Compare.definition.js.map