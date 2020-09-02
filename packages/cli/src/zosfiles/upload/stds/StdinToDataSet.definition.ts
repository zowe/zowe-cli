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

import * as path from "path";
import { ICommandDefinition } from "@zowe/imperative";
import { UploadOptions } from "../Upload.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).UPLOAD.ACTIONS.STDIN_TO_DATA_SET;

/**
 * Upload stdin-to-data-set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const StdinToDataSetDefinition: ICommandDefinition = {
    name: "stdin-to-data-set",
    aliases: ["stds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/StdinToDataSet.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        UploadOptions.volume,
        UploadOptions.binary,
        UploadOptions.recall
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.ps"`,
            prefix: `echo "hello world" |`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.pds(mem)"`,
            prefix: `echo "hello world" |`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"ibmuser.ps" --mr wait`,
            prefix: `echo "hello world" |`
        }
    ]
};
