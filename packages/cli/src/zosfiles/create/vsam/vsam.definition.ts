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

import { ICommandDefinition } from "@zowe/imperative";
import { VsamCreateOptions } from "./vsam.options";
import { ZosFilesConstants, CreateDefaults } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = (require("../../-strings-/en").default as typeof i18nTypings);
const vsamStrings = fileStrings.CREATE.ACTIONS.VSAM;

// Add the allowable values to the description of dataset organization.
const vsamDsOrg = ZosFilesCreateOptions.dsorg;
vsamDsOrg.description +=
    ".";
vsamDsOrg.defaultValue = CreateDefaults.VSAM.dsorg;
vsamDsOrg.allowableValues = {
    values: ZosFilesConstants.VSAM_DSORG_CHOICES,
    caseSensitive: false
};

// revise the description of size for VSAM.
const kbIndex = 3;
const vsamSize = Object.assign({}, ...[ZosFilesCreateExtraOptions.size]);
vsamSize.description =
    vsamStrings.OPTIONS.SIZE;
vsamSize.defaultValue = CreateDefaults.VSAM.primary + CreateDefaults.VSAM.alcunit;

// revise the description of secondary-space for VSAM.
const vsamSecondary = Object.assign({}, ...[ZosFilesCreateOptions.secondary]);
vsamSecondary.description = vsamStrings.OPTIONS.SECONDARY;

// Add the allowable values to the description of retainFor.
const vsamRetainFor = Object.assign({}, ...[VsamCreateOptions.retainFor]);

export const VsamDefinition: ICommandDefinition = {
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
        VsamCreateOptions.volumes,
        ZosFilesCreateOptions.storclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        vsamRetainFor,
        VsamCreateOptions.retainTo,
        ZosFilesCreateExtraOptions.showAttributes
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: vsamStrings.EXAMPLES.DEFAULT_VALUES,
            options: "SOME.DATA.SET.NAME"
        },
        {
            description: vsamStrings.EXAMPLES.SHOW_FIVE_MB,
            options: "SOME.DATA.SET.NAME --data-set-organization LINEAR --size 5MB --secondary-space 1 --show-attributes"
        },
        {
            description: vsamStrings.EXAMPLES.RETAIN_100_DAYS,
            options: "SOME.DATA.SET.NAME --retain-for 100 "
        }
    ]
};
