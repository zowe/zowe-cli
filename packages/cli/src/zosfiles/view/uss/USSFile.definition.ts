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
import { ViewOptions } from "../View.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).VIEW;

/**
 * View USS file content command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const USSFileDefinition: ICommandDefinition = {
    name: "uss-file",
    aliases: ["uf"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/USSFile.handler",
    profile: {
        required: ["zosmf"],
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
        ViewOptions.binary
    ],
    examples: [
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX1,
            options: `"/a/ibmuser/my_text.txt"`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `"/a/ibmuser/MyJavaClass.class" --binary`
        }
    ]
};
