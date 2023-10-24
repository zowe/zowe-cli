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
exports.PdsDefinition = void 0;
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const Create_options_1 = require("../Create.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.CREATE;
/**
 * Create PDS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.PdsDefinition = {
    name: "data-set-partitioned",
    aliases: ["pds"],
    description: strings.ACTIONS.DATA_SET_PARTITIONED.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Pds.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: strings.POSITIONALS.DATASETNAME,
            required: true
        }
    ],
    options: [
        Create_options_1.ZosFilesCreateExtraOptions.size,
        Create_options_1.ZosFilesCreateOptions.volser,
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.primary), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.primary }),
        Create_options_1.ZosFilesCreateOptions.secondary,
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.dirblk), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.dirblk }),
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.recfm), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.recfm }),
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.blksize), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.blksize }),
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.lrecl), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.lrecl }),
        Object.assign(Object.assign({}, Create_options_1.ZosFilesCreateOptions.alcunit), { defaultValue: zos_files_for_zowe_sdk_1.CreateDefaults.DATA_SET.PARTITIONED.alcunit }),
        Create_options_1.ZosFilesCreateOptions.storclass,
        Create_options_1.ZosFilesCreateOptions.mgntclass,
        Create_options_1.ZosFilesCreateOptions.dataclass,
        Create_options_1.ZosFilesCreateOptions.unit,
        Create_options_1.ZosFilesCreateOptions.dsntype,
        Create_options_1.ZosFilesCreateExtraOptions.showAttributes,
        Create_options_1.ZosFilesCreateExtraOptions.attributes
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_PARTITIONED.EXAMPLES.EX1,
            options: "NEW.PDS.DATASET"
        },
        {
            description: strings.ACTIONS.DATA_SET_PARTITIONED.EXAMPLES.EX2,
            options: "NEW.PDSE.DATASET --data-set-type LIBRARY"
        }
    ]
};
//# sourceMappingURL=Pds.definition.js.map