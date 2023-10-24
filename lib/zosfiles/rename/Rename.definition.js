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
exports.RenameDefinition = void 0;
const Ds_definition_1 = require("./ds/Ds.definition");
const Dsm_definition_1 = require("./dsm/Dsm.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.RENAME;
/**
 * Rename group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.RenameDefinition = {
    name: "rename",
    aliases: [],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        Ds_definition_1.DsDefinition,
        Dsm_definition_1.DsmDefinition
    ]
};
//# sourceMappingURL=Rename.definition.js.map