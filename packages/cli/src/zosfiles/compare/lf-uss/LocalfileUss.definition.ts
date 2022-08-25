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
export const LocalfileUssFileDefinition: ICommandDefinition = {
    name: "local-file-uss-file",
    aliases: ["lf-uss"],
    summary: strings.ACTIONS.LOCAL_FILE_USS_FILE.SUMMARY,
    description: strings.ACTIONS.LOCAL_FILE_USS_FILE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/LocalfileUss.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "localFilePath",
            description: strings.ACTIONS.LOCAL_FILE_USS_FILE.POSITIONALS.LOCALFILEPATH,
            type: "string",
            required: true
        },
        {
            name: "ussFilePath",
            type: "string",
            description: strings.ACTIONS.LOCAL_FILE_USS_FILE.POSITIONALS.USSFILEPATH,
            required: true
        }
    ],
    options: [
        CompareOptions.binary,
        CompareOptions.encoding,
        CompareOptions.seqnum,
        CompareOptions.contextLines,
        CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.LOCAL_FILE_USS_FILE.EXAMPLES.EX1,
            options: `"./a.txt" "/u/**/**/*.ext"`
        },
        {
            description: strings.ACTIONS.LOCAL_FILE_USS_FILE.EXAMPLES.EX2,
            options: `"./a.txt" "/u/**/**/*.ext" --no-seqnum`
        }
    ]
};
