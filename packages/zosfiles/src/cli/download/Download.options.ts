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
const strings = (require("../-strings-/en").default as typeof i18nTypings).DOWNLOAD.OPTIONS;

const maxConcurrentRequestsMaxValue = 99999;

/**
 * Object containing all options to be used by the Download data set API
 */
export const DownloadOptions: { [key: string]: ICommandOptionDefinition } = {
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
     * The encoding option
     * @type {ICommandOptionDefinition}
     */
    encoding: {
        name: "encoding",
        aliases: ["ec"],
        description: strings.ENCODING,
        type: "number"
    },

    /**
     * The local file to download the data set to
     * @type {ICommandOptionDefinition}
     */
    file: {
        name: "file",
        aliases: ["f"],
        description: strings.FILE,
        type: "string"
    },

    /**
     * The file extension to use for the downloaded file
     * @type {ICommandOptionDefinition}
     */
    extension: {
        name: "extension",
        aliases: ["e"],
        description: strings.EXTENSION,
        type: "stringOrEmpty"
    },

    /**
     * The directory to download all members to
     * @type {ICommandOptionDefinition}
     */
    directory: {
        name: "directory",
        aliases: ["d"],
        description: strings.DIRECTORY,
        type: "string"
    },

    /**
     * The pattern to be excluded
     * @type {ICommandOptionDefinition}
     */
    excludePattern: {
        name: "exclude-patterns",
        aliases: ["ep"],
        description: strings.EXCLUDE_PATTERN,
        type: "string"
    },

    /**
     * The extension-map to use for the downloaded file
     * @type {ICommandOptionDefinition}
     */
    extensionMap: {
        name: "extension-map",
        aliases: ["em"],
        description: strings.EXTENSION_MAP,
        type: "string",
        conflictsWith: ["extension"]
    },

    /**
     *  The maximum concurrent requests for "download all-members"
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

    preserveOriginalLetterCase: {
        name: "preserve-original-letter-case",
        aliases: ["po"],
        description: strings.PRESERVE_ORIGINAL_LETTER_CASE,
        type: "boolean",
        defaultValue: false
    }
};
