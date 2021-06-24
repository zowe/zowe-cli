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
import { ListOptions } from "../List.options";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).LIST.ACTIONS.USS_FILE;

/**
 * List all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const USSFileDefinition: ICommandDefinition = {
    name: "uss-files",
    aliases: ["uf", "uss"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssFile.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "path",
            description: strings.POSITIONALS.PATH,
            type: "string",
            required: true
        }
    ],
    options: [
        ListOptions.maxLength
    ],
    outputFormatOptions: true,
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"/u/ibmuser"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"/u/ibmuser" --rff name`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"/u/ibmuser" --rfh`
        }
    ]
};
