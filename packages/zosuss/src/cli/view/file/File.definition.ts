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
    aliases: ["f"],
    description: "View a z/OS USS file",
    handler: __dirname + "/File.handler",
    type: "command",
    positionals: [
        {
            name: "file",
            description: "Specify the file name to view",
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
            description: "View a file with live updates",
            type: "boolean"
        },
        {
            name: "iconv",
            aliases: ["i"],
            description: "Convert from one code page to another",
            type: "boolean"
        },
        {
            name: "iconvFrom",
            aliases: ["f"],
            description: "Code page from which you are converting. This option is only applicable when the iconv option is specified.",
            type: "string",
            defaultValue: "utf8",
        },
        {
            name: "iconvTo",
            aliases: ["t"],
            description: "Code page to which you are converting. This option is only applicable when the iconv option is specified.",
            type: "string",
            defaultValue: "IBM-1047",
        }
    ],
    profile: {
        optional: ["ssh"]
    },
    examples: [
        {
            description: "View a file",
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
