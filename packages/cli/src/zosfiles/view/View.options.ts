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

import { ICommandOptionDefinition } from "@zowe/core-for-zowe-sdk";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).VIEW.OPTIONS;

/**
 * Object containing all options to be used by the View API
 */
export const ViewOptions: { [key: string]: ICommandOptionDefinition } = {

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
        conflictsWith: ["binary", "record"]
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
     * The range of records to return
     * @type {ICommandOptionDefinition}
     */
    range: {
        name: "range",
        aliases: ["R"],
        description: strings.RANGE,
        type: "string"
    }
};
