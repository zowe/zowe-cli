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
import { CreateDefaults } from "../../../api/methods/create";
import { UssCreateOptions } from "./uss.options";
import { ZosFilesConstants } from "../../../api";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = (require("../../-strings-/en").default as typeof i18nTypings);
const ussStrings = fileStrings.CREATE.ACTIONS.USSFILE;

export const UssFileDefinition: ICommandDefinition = {
    name: "uss-file",
    aliases: ["file"],
    summary: ussStrings.SUMMARY,
    description: ussStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/ussFile.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "ussPath",
            type: "string",
            description: ussStrings.POSITIONALS.PATH,
            required: true,
        },
    ],
    options: [
        UssCreateOptions.mode
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: ussStrings.EXAMPLES.CREATE_FILE,
            options: "text.txt"
        },
        {
            description: ussStrings.EXAMPLES.SPECIFY_MODE,
            options: "text.txt -m rwxrwxrwx"
        }
    ]
};
