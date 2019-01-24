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

import { ICommandOptionDefinition } from "@brightside/imperative";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).UPLOAD.OPTIONS;

/**
 * Object containing all options to be used by the Upload API
 */
export const UploadOptions: {[key: string]: ICommandOptionDefinition} = {
    /**
     * The volume serial
     * @type {ICommandOptionDefinition}
     */
    volume: {
        name: "volume-serial",
        aliases: ["vs"],
        description: strings.VOLUME,
        type: "string"
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
     * The migrated recall option
     * @type {ICommandOptionDefinition}
     */
    recall: {
        name: "migrated-recall",
        aliases: ["mr"],
        description: strings.RECALL,
        type: "string",
        defaultValue: "nowait"
    },

    /**
     * The recursive option
     * @type {ICommandOptionDefinition}
     */
    recursive: {
        name: "recursive",
        aliases: ["r"],
        description: strings.RECURSIVE,
        type: "boolean"
    },

    /**
     * The binary_map option
     * @type {ICommandOptionDefinition}
     */
    binary_map: {
        name: "binary_map",
        aliases: ["bm"],
        description: strings.BINARY_MAP,
        type: "string",
        conflictsWith: ["ascii_map"]
    },

    /**
     * The ascii_map option
     * @type {ICommandOptionDefinition}
     */
    ascii_map: {
        name: "ascii_map",
        aliases: ["am"],
        description: strings.ASCII_MAP,
        type: "string",
        conflictsWith: ["binary_map"]
    }
};
