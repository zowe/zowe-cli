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
import { ICommandDefinition } from "@brightside/imperative";
import { UploadOptions } from "../Upload.options";
import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).UPLOAD.ACTIONS.DIR_TO_USS;

/**
 * Upload dir-to-uss command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DirToUSSDirDefinition: ICommandDefinition = {
    name: "dir-to-uss",
    aliases: ["dtu"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: path.join(__dirname, "/DirToUSSDir.handler"),
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "inputdir",
            description: strings.POSITIONALS.INPUTDIR,
            type: "string",
            required: true
        },
        {
            name: "USSDir",
            description: strings.POSITIONALS.USSDIR,
            type: "string",
            required: true
        },
    ],
    options: [
        UploadOptions.binary,
        UploadOptions.recursive,
        UploadOptions.binary_files,
        UploadOptions.ascii_files
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"local_dir" "/a/ibmuser/my_dir"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"local_dir" "/a/ibmuser/my_dir" "--recursive"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"local_dir" "/a/ibmuser/my_dir" "--binary-files" "myFile1.exe,myFile2.exe,myFile3.exe"`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"local_dir" "/a/ibmuser/my_dir" "--binary" "--ascii-files" "myFile1.txt,myFile2.txt,myFile3.txt"`
        }
    ]
};
