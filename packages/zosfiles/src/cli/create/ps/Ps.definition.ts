/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import { CreateDefaults } from "../../../api/methods/create";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE;

/**
 * Create PS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const PsDefinition: ICommandDefinition = {
    name: "data-set-sequential",
    aliases: ["ps"],
    description: strings.ACTIONS.DATA_SET_SEQUENTIAL.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Ps.handler",
    profile: {
        required: ["zosmf"],
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
            defaultValue: CreateDefaults.DATA_SET.SEQUENTIAL.primary + CreateDefaults.DATA_SET.SEQUENTIAL.alcunit
        },
        ZosFilesCreateOptions.volser,
        {...ZosFilesCreateOptions.secondary, defaultValue: CreateDefaults.DATA_SET.SEQUENTIAL.secondary},
        ZosFilesCreateOptions.dirblk,
        {...ZosFilesCreateOptions.recfm, defaultValue: CreateDefaults.DATA_SET.SEQUENTIAL.recfm},
        {...ZosFilesCreateOptions.blksize, defaultValue: CreateDefaults.DATA_SET.SEQUENTIAL.blksize},
        {...ZosFilesCreateOptions.lrecl, defaultValue: CreateDefaults.DATA_SET.SEQUENTIAL.lrecl},
        ZosFilesCreateOptions.storeclass,
        ZosFilesCreateOptions.mgntclass,
        ZosFilesCreateOptions.dataclass,
        ZosFilesCreateOptions.unit,
        ZosFilesCreateExtraOptions.showAttributes,
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.ACTIONS.DATA_SET_SEQUENTIAL.EXAMPLES.EX1,
            options: "NEW.PS.DATASET",
        }

    ]
};
