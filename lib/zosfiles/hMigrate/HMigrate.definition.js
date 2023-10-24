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
exports.HMigrateDefinition = void 0;
const Ds_definition_1 = require("./ds/Ds.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const { DESCRIPTION } = require("../-strings-/en").default.HMIGRATE;
/**
 * hMigrate group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.HMigrateDefinition = {
    name: "migrate",
    aliases: ["hmigr", "hMigrate"],
    type: "group",
    description: DESCRIPTION,
    children: [
        Ds_definition_1.DsDefinition
    ]
};
//# sourceMappingURL=HMigrate.definition.js.map