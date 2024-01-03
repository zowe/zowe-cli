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
import { CreateDefaults } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE;

/**
 * Create Binary PDS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const BinaryPDSDefinition: ICommandDefinition = {
    name: "data-set-binary",
    aliases: ["bin"],
    summary: strings.ACTIONS.DATA_SET_BINARY.SUMMARY,
    description: strings.ACTIONS.DATA_SET_BINARY.DESCRIPTION,
    type: "command",
    handler: __dirname + "/BinaryPDS.handler",
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
        ZosFilesCreateExtraOptions.size,
        {...ZosFilesCreateOptions.primary, defaultValue: CreateDefaults.DATA_SET.BINARY.primary},
        ZosFilesCreateOptions.volser,
        ZosFilesCreateOptions.secondary,
        {...ZosFilesCreateOptions.dirblk, defaultValue: CreateDefaults.DATA_SET.BINARY.dirblk},
        {...ZosFilesCreateOptions.recfm, defaultValue: CreateDefaults.DATA_SET.BINARY.recfm},
        {...ZosFilesCreateOptions.blksize, defaultValue: CreateDefaults.DATA_SET.BINARY.blksize},
        {...ZosFilesCreateOptions.lrecl, defaultValue: CreateDefaults.DATA_SET.BINARY.lrecl},
        ZosFilesCreateOptions.storclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZosFilesCreateOptions.unit,
        ZosFilesCreateOptions.dsntype,
        ZosFilesCreateExtraOptions.attributes
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_BINARY.EXAMPLES.EX1,
            options: "NEW.BINARY.DATASET"
        },
        {
            description: strings.ACTIONS.DATA_SET_BINARY.EXAMPLES.EX2,
            options: "NEW.BINARY.DATASET --data-set-type LIBRARY"
        }
    ]
};
