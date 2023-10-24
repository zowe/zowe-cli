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
exports.SubmitDefinition = void 0;
const DataSet_definition_1 = require("./data-set/DataSet.definition");
const localFile_definition_1 = require("./local-file/localFile.definition");
const stdin_definition_1 = require("./stdin/stdin.definition");
const USSFile_definition_1 = require("./uss-file/USSFile.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.SUBMIT;
exports.SubmitDefinition = {
    name: "submit",
    aliases: ["sub"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        DataSet_definition_1.DataSetDefinition,
        localFile_definition_1.LocalFileDefinition,
        stdin_definition_1.StdinDefinition,
        USSFile_definition_1.USSFileDefinition
    ]
};
//# sourceMappingURL=Submit.definition.js.map