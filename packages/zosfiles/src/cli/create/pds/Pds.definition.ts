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
import { CreateDefaults } from "../../../api/methods/create";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE;

/**
 * Create PDS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const PdsDefinition: ICommandDefinition = {
    name: "data-set-partitioned",
    aliases: ["pds"],
    description: strings.ACTIONS.DATA_SET_PARTITIONED.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Pds.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: strings.POSITIONALS.DATASETNAME,
            required: true,
        },
    ],
    options: [
        ZosFilesCreateExtraOptions.size,
        ZosFilesCreateOptions.volser,
        {...ZosFilesCreateOptions.primary, defaultValue: CreateDefaults.DATA_SET.PARTITIONED.primary},
        ZosFilesCreateOptions.secondary,
        {...ZosFilesCreateOptions.dirblk, defaultValue: CreateDefaults.DATA_SET.PARTITIONED.dirblk},
        {...ZosFilesCreateOptions.recfm, defaultValue: CreateDefaults.DATA_SET.PARTITIONED.recfm},
        {...ZosFilesCreateOptions.blksize, defaultValue: CreateDefaults.DATA_SET.PARTITIONED.blksize},
        {...ZosFilesCreateOptions.lrecl, defaultValue: CreateDefaults.DATA_SET.PARTITIONED.lrecl},
        ZosFilesCreateOptions.storeclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZosFilesCreateOptions.unit,
        ZosFilesCreateOptions.dsntype,
        ZosFilesCreateExtraOptions.showAttributes,
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_PARTITIONED.EXAMPLES.EX1,
            options: "NEW.PDS.DATASET",
        }

    ]
};
