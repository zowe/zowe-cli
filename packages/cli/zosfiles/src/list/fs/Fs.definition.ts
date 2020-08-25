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
import { ListOptions } from "../List.options";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).LIST.ACTIONS.FS;

/**
 * List data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const FsDefinition: ICommandDefinition = {
    name: "file-system",
    aliases: ["fs"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    outputFormatOptions: true,
    handler: path.join(__dirname, "Fs.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: [
        ListOptions.maxLength,
        ListOptions.fsname,
        ListOptions.path
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: ""
        },
        {
            description: strings.EXAMPLES.EX2,
            options: "-p /a/ibmuser"
        },
        {
            description: strings.EXAMPLES.EX3,
            options: "-f MY.ZFS"
        }
    ]
};
