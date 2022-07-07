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
const strings = (require("../-strings-/en").default as typeof i18nTypings).COMPARE.OPTIONS;

/**
 * Object containing all options to be used by the Compare API
 */
export const CompareOptions: { [key: string]: ICommandOptionDefinition } = {

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
     * The binary option for file 2
     * @type {ICommandOptionDefinition}
     */
    binary2: {
        name: "binary2",
        aliases: ["b2"],
        description: strings.BINARY2,
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
        type: "string"
    },

    /**
     * The encoding option for file 2
     * @type {ICommandOptionDefinition}
     */
    encoding2: {
        name: "encoding2",
        aliases: ["ec2"],
        description: strings.ENCODING2,
        type: "string"
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
     * The record option for file 2
     * @type {ICommandOptionDefinition}
     */
    record2: {
        name: "record2",
        aliases: ["r2"],
        description: strings.RECORD2,
        type: "boolean",
        conflictsWith: ["binary2"]
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
     * The volume serial for file 2
     * @type {ICommandOptionDefinition}
     */

    volume2: {
        name: "volume-serial2",
        aliases: ["vs2"],
        description: strings.VOLUME2,
        type: "string"
    },

    /**
     * The noseqnum option
     * @type {ICommandOptionDefinition}
     */

    seqnum: {
        name: "seqnum",
        aliases: ["sn"],
        description: strings.SEQNUM,
        defaultValue: true,
        type: "boolean"
    },

    /**
     * The contextlines option
     * @type {ICommandOptionDefinition}
     */

    contextlines: {
        name: "context-lines",
        aliases: ["cl"],
        description: strings.CONTEXTLINES,
        type: "number"
    }
};
