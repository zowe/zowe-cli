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
 * Create C-code PDS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const CPDSDefinition: ICommandDefinition = {
    name: "data-set-c",
    aliases: ["dsc"],
    description: strings.ACTIONS.DATA_SET_C.DESCRIPTION,
    type: "command",
    handler: __dirname + "/CPDS.handler",
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
        {
            ...ZosFilesCreateExtraOptions.size,
            defaultValue: CreateDefaults.DATA_SET.C.primary + CreateDefaults.DATA_SET.C.alcunit
        },
        ZosFilesCreateOptions.volser,
        ZosFilesCreateOptions.primary,
        ZosFilesCreateOptions.secondary,
        {...ZosFilesCreateOptions.dirblk, defaultValue: CreateDefaults.DATA_SET.C.dirblk},
        {...ZosFilesCreateOptions.recfm, defaultValue: CreateDefaults.DATA_SET.C.recfm},
        {...ZosFilesCreateOptions.blksize, defaultValue: CreateDefaults.DATA_SET.C.blksize},
        {...ZosFilesCreateOptions.lrecl, defaultValue: CreateDefaults.DATA_SET.C.lrecl},
        ZosFilesCreateOptions.storeclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZosFilesCreateOptions.unit,
        ZosFilesCreateOptions.dsntype,
        ZosFilesCreateExtraOptions.showAttributes,
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_C.EXAMPLES.EX1,
            options: "NEW.CCODE.DATASET",
        }
    ]
};
