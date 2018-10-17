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

import * as path from "path";
import { ICommandDefinition } from "@brightside/imperative";
import { UploadOptions } from "../Upload.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).UPLOAD.ACTIONS.FILE_TO_DATA_SET;

/**
 * Upload file-to-data-set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const FileToDataSetDefinition: ICommandDefinition = {
    name: "file-to-data-set",
    aliases: ["ftds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/FileToDataSet.handler"),
    profile: {
        required: ["zosmf"],
    },
    positionals: [
        {
            name: "inputfile",
            description: strings.POSITIONALS.INPUTFILE,
            type: "string",
            required: true
        },
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        },
    ],
    options: [
        UploadOptions.volume,
        UploadOptions.binary,
        UploadOptions.recall
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"file.txt" "ibmuser.ps"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"file.txt" "ibmuser.pds(mem)"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"file.txt" "ibmuser.ps" --mr wait`
        },
    ]
};
