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
const BinaryPDS_definition_1 = require("./binaryPds/BinaryPDS.definition");
const ClassicPDS_definition_1 = require("./classicPds/ClassicPDS.definition");
const CPDS_definition_1 = require("./cPds/CPDS.definition");
const ds_definition_1 = require("./ds/ds.definition");
const Pds_definition_1 = require("./pds/Pds.definition");
const Ps_definition_1 = require("./ps/Ps.definition");
const vsam_definition_1 = require("./vsam/vsam.definition");
const zfs_definition_1 = require("./zfs/zfs.definition");
const ussDir_definition_1 = require("./ussDir/ussDir.definition");
const ussFile_definition_1 = require("./ussFile/ussFile.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.CREATE;
/**
 * Create group definition containing its description and children
 * @type {ICommandDefinition}
 */
exports.CreateDefinition = {
    name: "create",
    aliases: ["cre"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [Ps_definition_1.PsDefinition,
        Pds_definition_1.PdsDefinition,
        BinaryPDS_definition_1.BinaryPDSDefinition,
        CPDS_definition_1.CPDSDefinition,
        ClassicPDS_definition_1.ClassicPDSDefinition,
        ds_definition_1.DsDefinition,
        vsam_definition_1.VsamDefinition,
        zfs_definition_1.ZfsDefinition,
        ussFile_definition_1.UssFileDefinition,
        ussDir_definition_1.UssDirDefinition
    ]
};
//# sourceMappingURL=Create.definition.js.map