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
exports.DsDefinition = void 0;
const Create_options_1 = require("../Create.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.CREATE;
/**
 * Create dataSet command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.DsDefinition = {
    name: "data-set",
    aliases: ["ds"],
    description: strings.ACTIONS.DATA_SET_LIKE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/ds.handler",
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
        Create_options_1.ZosFilesCreateOptions.primary,
        Create_options_1.ZosFilesCreateOptions.secondary,
        Create_options_1.ZosFilesCreateOptions.dirblk,
        Create_options_1.ZosFilesCreateOptions.recfm,
        Create_options_1.ZosFilesCreateOptions.blksize,
        Create_options_1.ZosFilesCreateOptions.lrecl,
        Create_options_1.ZosFilesCreateOptions.storclass,
        Create_options_1.ZosFilesCreateOptions.mgntclass,
        Create_options_1.ZosFilesCreateOptions.dataclass,
        Create_options_1.ZosFilesCreateOptions.unit,
        Create_options_1.ZosFilesCreateOptions.dsntype,
        Create_options_1.ZosFilesCreateExtraOptions.showAttributes,
        Create_options_1.ZosFilesCreateExtraOptions.attributes,
        Create_options_1.ZosFilesCreateExtraOptions.like
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_LIKE.EXAMPLES.EX1,
            options: "NEW.DATASET --like EXISTING.DATASET"
        },
        {
            description: strings.ACTIONS.DATA_SET_LIKE.EXAMPLES.EX2,
            options: "NEW.DATASET --like EXISTING.DATASET --lrecl 1024"
        },
        {
            description: strings.ACTIONS.DATA_SET_LIKE.EXAMPLES.EX3,
            options: "NEW.DATASET --data-set-type LIBRARY"
        }
    ]
};
//# sourceMappingURL=ds.definition.js.map