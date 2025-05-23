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
import { DownloadOptions } from "../Download.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DOWNLOAD.ACTIONS.USS_FILE;

/**
 * Download data set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const UssFileDefinition: ICommandDefinition = {
    name: "uss-file",
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
            name: "ussFileName",
            description: strings.POSITIONALS.USSFILENAME,
            type: "string",
            required: true
        }
    ],
    options: [
        DownloadOptions.attributes,
        DownloadOptions.file,
        DownloadOptions.binary,
        DownloadOptions.encoding
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"/a/ibmuser/my_text.txt" --file ./my_text.txt`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"/a/ibmuser/MyJava.class" --binary --file "java/MyJava.class"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"/a/ibmuser/MyJava.class" --attributes /path/to/.zosattributes --file "java/MyJava.class"`
        }
    ]
};
