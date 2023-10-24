"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListOptions = void 0;
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.LIST.OPTIONS;
/**
 * Object containing all options to be used by the List data-set/member API
 */
exports.ListOptions = {
    /**
     * The volume serial
     * @type {ICommandOptionDefinition}
     */
    volume: {
        name: "volume-serial",
        aliases: ["vs"],
        description: strings.VOLUME,
        type: "string",
        stringLengthRange: [1, 6] // eslint-disable-line @typescript-eslint/no-magic-numbers
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
     * An optional search parameter that specifies the first data set name to return in the response document.
     */
    start: {
        name: "start",
        aliases: ["s"],
        description: strings.START,
        type: "string"
    },
    /**
     * An optional USS search parameter for a file or directory name
     */
    name: {
        name: "name",
        description: strings.NAME,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by group name or number
     */
    group: {
        name: "group",
        description: strings.GROUP,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by owner name or number
     */
    owner: {
        name: "owner",
        description: strings.OWNER,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by modified time in number of days
     */
    mtime: {
        name: "mtime",
        description: strings.MTIME,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by file size
     */
    size: {
        name: "size",
        description: strings.SIZE,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by permission octal string
     */
    perm: {
        name: "perm",
        description: strings.PERM,
        type: "string"
    },
    /**
     * An optional USS search parameter to filter by the type of file, directory, device, or special file
     */
    type: {
        name: "type",
        description: strings.TYPE,
        type: "string",
        allowableValues: { values: ["f", "d", "l", "p", "s"], caseSensitive: true }
    },
    /**
     * An optional USS search parameter to limit the depth of the file and directory search
     */
    depth: {
        name: "depth",
        description: strings.DEPTH,
        type: "number"
    },
    /**
     * An optional USS search parameter to determine whether or not to search all filesystems
     */
    filesys: {
        name: "filesys",
        description: strings.FILESYS,
        type: "boolean"
    },
    /**
     * An optional USS search parameter to determine whether or not to follow symlinks
     */
    symlinks: {
        name: "symlinks",
        description: strings.SYMLINKS,
        type: "boolean"
    }
};
//# sourceMappingURL=List.options.js.map