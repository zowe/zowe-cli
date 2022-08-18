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
import { CompareOptions } from "../Compare.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COMPARE;

/**
 * Compare local files and data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const LocalfileDatasetDefinition: ICommandDefinition = {
    name: "local-file-data-set",
    aliases: ["lds"],
    summary: strings.ACTIONS.LOCAL_FILE_DATA_SET.SUMMARY,
    description: strings.ACTIONS.LOCAL_FILE_DATA_SET.DESCRIPTION,
    type: "command",
    handler: __dirname + "/LocalfileDataset.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "localFilePath",
            description: strings.ACTIONS.LOCAL_FILE_DATA_SET.POSITIONALS.LOCALFILEPATH,
            type: "string",
            required: true
        },
        {
            name: "dataSetName",
            type: "string",
            description: strings.ACTIONS.LOCAL_FILE_DATA_SET.POSITIONALS.DATASETNAME,
            required: true
        }
    ],
    options: [
        CompareOptions.binary,
        CompareOptions.encoding,
        CompareOptions.record,
        CompareOptions.volume,
        CompareOptions.seqnum,
        CompareOptions.contextLines,
        CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.LOCAL_FILE_DATA_SET.EXAMPLES.EX1,
            options: `"./a.txt" "sys1.samplib(antxtso)"`
        },
        {
            description: strings.ACTIONS.LOCAL_FILE_DATA_SET.EXAMPLES.EX2,
            options: `"./a.txt" "sys1.samplib(antxtso)" --no-seqnum`
        }
    ]
};
