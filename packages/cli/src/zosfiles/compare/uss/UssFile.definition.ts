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
 * Compare data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const UssFileDefinition: ICommandDefinition = {
    name: "uss-files",
    aliases: ["uss"],
    summary: strings.ACTIONS.USS_FILE.SUMMARY,
    description: strings.ACTIONS.USS_FILE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssFile.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "ussFilePath1",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILEPATH1,
            type: "string",
            required: true
        },
        {
            name: "ussFilePath2",
            type: "string",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILEPATH2,
            required: true
        }
    ],
    options: [
        CompareOptions.binary,
        CompareOptions.binary2,
        CompareOptions.encoding,
        CompareOptions.encoding2,
        CompareOptions.record,
        CompareOptions.record2,
        CompareOptions.volume,
        CompareOptions.volume2,
        CompareOptions.seqnum,
        CompareOptions.contextLines,
        CompareOptions.browserview
    ],
    examples: [
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `"/u/**/**/*.ext" "/u/**/**/*.ext"`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `"/u/**/**/*.ext" "/u/**/**/*.ext" --no-seqnum`
        }
    ]
};
