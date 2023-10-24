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
exports.DeleteDefinition = void 0;
const Ds_definition_1 = require("./ds/Ds.definition");
const Vsam_definition_1 = require("./vsam/Vsam.definition");
const Uss_definition_1 = require("./uss/Uss.definition");
const zfs_definition_1 = require("./zfs/zfs.definition");
const Mds_definition_1 = require("./mds/Mds.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.DELETE;
/**
 * This object defines the command for the delete group within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
exports.DeleteDefinition = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        Ds_definition_1.DsDefinition,
        Mds_definition_1.MdsDefinition,
        Vsam_definition_1.VsamDefinition,
        Uss_definition_1.UssDefinition,
        zfs_definition_1.ZfsDefinition
    ]
};
//# sourceMappingURL=Delete.definition.js.map