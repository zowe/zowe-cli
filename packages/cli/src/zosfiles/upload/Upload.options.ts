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

import { ICommandOptionDefinition } from "@zowe/imperative";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).UPLOAD.OPTIONS;

const maxConcurrentRequestsMaxValue = 99999;

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
     * The record option
     * @type {ICommandOptionDefinition}
     */
    record: {
        name: "record",
        aliases: ["r"],
        description: strings.RECORD,
        type: "boolean",
        conflictsWith: ["binary"]
    },

    /**
     * The encoding option
     * @type {ICommandOptionDefinition}
     */
    encoding: {
        name: "encoding",
        aliases: ["ec"],
        description: strings.ENCODING,
        type: "string"
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
     * The binary-files option
     * @type {ICommandOptionDefinition}
     */
    binaryFiles: {
        name: "binary-files",
        aliases: ["bf"],
        description: strings.BINARY_FILES,
        type: "string",
        conflictsWith: ["ascii-files"]
    },

    /**
     * The ascii-files option
     * @type {ICommandOptionDefinition}
     */
    asciiFiles: {
        name: "ascii-files",
        aliases: ["af"],
        description: strings.ASCII_FILES,
        type: "string",
        conflictsWith: ["binary-files"]
    },

    /**
     * The attributes option
     * @type {ICommandOptionDefinition}
     */
    attributes: {
        name: "attributes",
        aliases: ["attrs"],
        description: strings.ATTRIBUTES,
        type: "string",
        conflictsWith: ["ascii-files, binary-files"]
    },

    /**
     * The maximum concurrent requests for upload
     * @type {ICommandOptionDefinition}
     */
    maxConcurrentRequests: {
        name: "max-concurrent-requests",
        aliases: ["mcr"],
        description: strings.MAX_CONCURRENT_REQUESTS,
        type: "number",
        defaultValue: 1,
        numericValueRange: [0, maxConcurrentRequestsMaxValue]
    },

    /**
     * The include hidden option for upload
     */
    includeHidden: {
        name: "include-hidden",
        aliases: ["ih"],
        description: strings.INCLUDE_HIDDEN,
        type: "boolean"
    }
};
