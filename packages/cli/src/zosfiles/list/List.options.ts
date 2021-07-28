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
const strings = (require("../-strings-/en").default as typeof i18nTypings).LIST.OPTIONS;

/**
 * Object containing all options to be used by the List data-set/member API
 */
export const ListOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The volume serial
     * @type {ICommandOptionDefinition}
     */
    volume: {
        name: "volume-serial",
        aliases: ["vs"],
        description: strings.VOLUME,
        type: "string",
        stringLengthRange: [1, 6]  // tslint:disable-line:no-magic-numbers
    },

    /**
     * The indicator that we want to show more attributes
     * @type {ICommandOptionDefinition}
     */
    attributes: {
        name: "attributes",
        aliases: ["a"],
        description: strings.ATTRIBUTES,
        type: "boolean"
    },

    /**
     * The indicator of how many lines will the list have, the default is 0 which means all the data sets.
     * @type {ICommandOptionDefinition}
     */
    maxLength: {
        name: "max-length",
        aliases: ["max"],
        description: strings.MAXLENGTH,
        type: "number"
    },

    /**
     * The pattern to match against a list of members in a data set.
     * @type {ICommandOptionDefinition}
     */
    pattern: {
        name: "pattern",
        description: strings.PATTERN,
        type: "string"
    },

    /**
     * The indicator that where ti file syste is mounted.
     * @type {ICommandOptionDefinition}
     */
    path: {
        name: "path",
        aliases: ["p"],
        description: strings.PATH,
        type: "string"
    },

    /**
     * The indicator that where the name of mounted.
     * @type {ICommandOptionDefinition}
     */
    fsname: {
        name: "fsname",
        aliases: ["f"],
        description: strings.FSNAME,
        type: "string",
        conflictsWith: ["path"]
    },

    /**
     * The indicator that we want to show REST API level debug info.
     * @type {ICommandOptionDefinition}
     */
    messageResponse: {
        name: "message-response",
        aliases: ["mr"],
        description: strings.MESSAGERESPONSE,
        type: "boolean"
    }
};
