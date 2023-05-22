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

import {ICommandDefinition} from "@zowe/imperative";
import { EditOptions } from "../Edit.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).EDIT;

/**
 * Edit USS file content command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const USSFileDefinition: ICommandDefinition = {
    name: "uss-file",
    aliases: ["uss", "uf"],
    summary: strings.ACTIONS.USS_FILE.SUMMARY,
    description: strings.ACTIONS.USS_FILE.DESCRIPTION,
    type: "command",
    handler: __dirname + "/../Edit.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "file",
            description: strings.ACTIONS.USS_FILE.POSITIONALS.USSFILE,
            type: "string",
            required: true
        },
    ],
    options: [
        EditOptions.editor,
        EditOptions.extension
    ],
    examples: [
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `/a/ibmuser/my_text.txt --editor notepad`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `/a/ibmuser/my_text.txt --editor C:\\Windows\\System32\\Notepad.exe`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `C:\\Windows\\System32\\Notepad.exe --editor notepad --extension jcl`
        }
    ]
};
