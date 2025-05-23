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
import { join } from "path";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE.ACTIONS.USS;

/**
 * This object defines the command for delete data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const UssDefinition: ICommandDefinition = {
    name: "uss-file",
    aliases: ["uf", "uss"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Uss.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fileName",
            type: "string",
            description: strings.POSITIONALS.FILENAME,
            required: true
        }
    ],
    options: [
        {
            name: "for-sure",
            aliases: ["f"],
            description: strings.OPTIONS.FOR_SURE,
            type: "boolean",
            required: true
        },
        {
            name: "recursive",
            aliases: ["r"],
            description: strings.OPTIONS.RECURSIVE,
            type: "boolean",
            required: false
        },
        {
            name: "ignore-not-found",
            aliases: ["i", "inf"],
            description: strings.OPTIONS.IGNORE_NF,
            type: "boolean",
            required: false
        }
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"/a/ibmuser/testcases" --for-sure`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"/a/ibmuser/testcases/my_text.txt" --for-sure`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"/a/ibmuser/testcases" --recursive --for-sure`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"/a/ibmuser/testcases" --for-sure --ignore-not-found`
        }
    ]
};
