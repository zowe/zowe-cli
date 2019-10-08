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
    positionals: [{
        name: "file",
        description: "View a z/OS USS file",
        type: "string",
        required: true
    }],
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
            description: "Convert from one page code to another",
            type: "boolean"
        },
        {
            name: "from",
            description: "Codeset that you are converting from",
            type: "string"
        },
        {
            name: "to",
            description: "Codeset that you are converting to",
            type: "string"
        }
    ],
    profile: {
        optional: ["ssh"]
    },
    examples: [{
        description: "View a file, giving the working directory",
        options: "\"file.txt\" --cwd /u/cicprov/mnt/CICPY01I/bundles/myapp "
    }]
};
