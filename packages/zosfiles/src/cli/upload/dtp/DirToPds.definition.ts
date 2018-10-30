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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).UPLOAD.ACTIONS.DIR_TO_PDS;

/**
 * Upload dir-to-pds command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DirToPdsDefinition: ICommandDefinition = {
    name: "dir-to-pds",
    aliases: ["dtp"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/DirToPds.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "inputdir",
            description: strings.POSITIONALS.INPUTDIR,
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
            options: `"src" "ibmuser.src"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"src" "ibmuser.src" --mr wait`
        }
    ]
};
