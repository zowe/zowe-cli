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
exports.VsamDefinition = void 0;
const vsam_options_1 = require("./vsam.options");
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const Create_options_1 = require("../Create.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = require("../../-strings-/en").default;
const vsamStrings = fileStrings.CREATE.ACTIONS.VSAM;
// Add the allowable values to the description of dataset organization.
const vsamDsOrg = Create_options_1.ZosFilesCreateOptions.dsorg;
vsamDsOrg.description +=
    ".";
vsamDsOrg.defaultValue = zos_files_for_zowe_sdk_1.CreateDefaults.VSAM.dsorg;
vsamDsOrg.allowableValues = {
    values: zos_files_for_zowe_sdk_1.ZosFilesConstants.VSAM_DSORG_CHOICES,
    caseSensitive: false
};
// revise the description of size for VSAM.
const vsamSize = Object.assign({}, ...[Create_options_1.ZosFilesCreateExtraOptions.size]);
vsamSize.description =
    vsamStrings.OPTIONS.SIZE;
vsamSize.defaultValue = zos_files_for_zowe_sdk_1.CreateDefaults.VSAM.primary + zos_files_for_zowe_sdk_1.CreateDefaults.VSAM.alcunit;
// revise the description of secondary-space for VSAM.
const vsamSecondary = Object.assign({}, ...[Create_options_1.ZosFilesCreateOptions.secondary]);
vsamSecondary.description = vsamStrings.OPTIONS.SECONDARY;
// Add the allowable values to the description of retainFor.
const vsamRetainFor = Object.assign({}, ...[vsam_options_1.VsamCreateOptions.retainFor]);
exports.VsamDefinition = {
    name: "data-set-vsam",
    aliases: ["vsam"],
    description: vsamStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/vsam.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: vsamStrings.POSITIONALS.DATASETNAME,
            required: true
        }
    ],
    options: [
        vsamDsOrg,
        vsamSize,
        vsamSecondary,
        vsam_options_1.VsamCreateOptions.volumes,
        Create_options_1.ZosFilesCreateOptions.storclass,
        Create_options_1.ZosFilesCreateOptions.mgntclass,
        Create_options_1.ZosFilesCreateOptions.dataclass,
        vsamRetainFor,
        vsam_options_1.VsamCreateOptions.retainTo,
        Create_options_1.ZosFilesCreateExtraOptions.showAttributes,
        Create_options_1.ZosFilesCreateExtraOptions.attributes
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: vsamStrings.EXAMPLES.DEFAULT_VALUES,
            options: "SOME.DATA.SET.NAME"
        },
        {
            description: vsamStrings.EXAMPLES.SHOW_FIVE_MB,
            options: "SOME.DATA.SET.NAME --data-set-organization LINEAR --size 5MB --secondary-space 1 --attributes"
        },
        {
            description: vsamStrings.EXAMPLES.RETAIN_100_DAYS,
            options: "SOME.DATA.SET.NAME --retain-for 100 "
        }
    ]
};
//# sourceMappingURL=vsam.definition.js.map