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
 * Create Classic PDS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const ClassicPDSDefinition: ICommandDefinition = {
    name: "data-set-classic",
    aliases: ["classic"],
    description: strings.ACTIONS.DATA_SET_CLASSIC.DESCRIPTION,
    type: "command",
    handler: __dirname + "/ClassicPDS.handler",
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
        {...ZosFilesCreateOptions.primary, defaultValue: CreateDefaults.DATA_SET.CLASSIC.primary},
        ZosFilesCreateOptions.volser,
        ZosFilesCreateOptions.secondary,
        {...ZosFilesCreateOptions.dirblk, defaultValue: CreateDefaults.DATA_SET.CLASSIC.dirblk},
        {...ZosFilesCreateOptions.recfm, defaultValue: CreateDefaults.DATA_SET.CLASSIC.recfm},
        {...ZosFilesCreateOptions.blksize, defaultValue: CreateDefaults.DATA_SET.CLASSIC.blksize},
        {...ZosFilesCreateOptions.lrecl, defaultValue: CreateDefaults.DATA_SET.CLASSIC.lrecl},
        ZosFilesCreateOptions.storclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZosFilesCreateOptions.unit,
        ZosFilesCreateOptions.dsntype,
        ZosFilesCreateExtraOptions.showAttributes
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_CLASSIC.EXAMPLES.EX1,
            options: "NEW.CLASSIC.DATASET"
        }

    ]
};
