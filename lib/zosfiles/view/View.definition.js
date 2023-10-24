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
const Dataset_definition_1 = require("./ds/Dataset.definition");
const USSFile_definition_1 = require("./uss/USSFile.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.VIEW;
/**
 * View group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.ViewDefinition = {
    name: "view",
    aliases: ["vw"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        Dataset_definition_1.DatasetDefinition,
        USSFile_definition_1.USSFileDefinition
    ],
};
//# sourceMappingURL=View.definition.js.map