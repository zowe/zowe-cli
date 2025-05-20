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

import { ICommandOptionDefinition } from "npm:@zowe/imperative";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).EDIT.OPTIONS;

/**
 * Object containing all options to be used by the Edit API
 */
export const EditOptions: { [key: string]: ICommandOptionDefinition } = {

    /**
     * The option to set a default editor
     * @type {ICommandOptionDefinition}
     */
    editor: {
        name: "editor",
        aliases: ["ed"],
        description: strings.EDITOR,
        type: "string",
        required: false
    },
    /**
     * The option to label your file's data type
     * @type {ICommandOptionDefinition}
     */
    extension: {
        name: "extension",
        aliases: ["ext"],
        description: strings.EXTENSION,
        type: "string",
        required: false
    },
    /**
     * The binary option
     * @type {ICommandOptionDefinition}
     */
    binary: {
        name: "binary",
        aliases: ["b"],
        description: strings.BINARY,
        type: "boolean"
    },

    /**
     * The encoding option
     * @type {ICommandOptionDefinition}
     */
    encoding: {
        name: "encoding",
        aliases: ["ec"],
        description: strings.ENCODING,
        type: "string",
        conflictsWith: ["binary"]
    },
};
