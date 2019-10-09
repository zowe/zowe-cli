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

export const FileDefinition: ICommandDefinition = {
    name: "file",
    aliases: ["file"],
    description: "View a z/OS USS file",
    handler: __dirname + "/File.handler",
    type: "command",
    positionals: [
        {
            name: "file",
            description: "View a z/OS USS file",
            type: "string",
            required: true
        }
    ],
    options: [
        {
            name: "cwd",
            description: "Working directory in which to execute the command",
            type: "string"
        },
        {
            name: "tail",
            description: "Continually view files and get live updates",
            type: "boolean"
        },
        {
            name: "iconv",
            aliases: ["i"],
            description: "Convert from one page code to another.",
            type: "boolean",
        },
        {
            name: "iconvFrom",
            aliases: ["f"],
            description: "Codeset that you are converting from",
            type: "string",
            defaultValue: "utf8",
            impliesOneOf: ["iconv"]
        },
        {
            name: "iconvTo",
            aliases: ["t"],
            description: "Codeset that you are converting to",
            type: "string",
            defaultValue: "IBM-1047",
            impliesOneOf: ["iconv"]
        }
    ],
    profile: {
        optional: ["ssh"]
    },
    examples: [
        {
            description: "View a file, giving the working directory",
            options: '"/u/files/file.txt" '
        },
        {
            description: "View a file, giving the working directory",
            options: '"file.txt" --cwd /u/cicprov/mnt/CICPY01I/bundles/myapp'
        },
        {
            description: "View a utf8 file, converting to 1047 EBCDIC",
            options: '"/u/files/file.txt" --iconv '
        },
        {
            description: "View a file converting from one code page to another",
            options: '"/u/files/file.txt" --iconv --iconvFrom utf8 --iconvTo IBM1057'
        },
    ]
};
