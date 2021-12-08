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
const strings = (require("../-strings-/en").default as typeof i18nTypings).CREATE.OPTIONS;

/**
 * Object containing all extra options to be used by the Create API
 */
export const ZosFilesCreateExtraOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The indicator of a flat file creation (Sequential data set)
     * @type {ICommandOptionDefinition}
     */
    flatFile: {
        name: "flat-file",
        aliases: ["ff"],
        description: strings.FLATFILE,
        type: "boolean"
    },

    /**
     * The indicator that we should print all allocation attributes
     * @type {ICommandOptionDefinition}
     * @deprecated
     */
     showAttributes: {
        name: "show-attributes",
        aliases: ["pa"],
        description: strings.SHOWATTRIBUTES,
        hidden: true,
        type: "boolean"
    },

    /**
     * The indicator that we should print all allocation attributes
     * @type {ICommandOptionDefinition}
     */
    attributes: {
        name: "attributes",
        aliases: ["a"],
        description: strings.SHOWATTRIBUTES,
        type: "boolean"
    },

    /**
     * The size of the data set
     * @type {ICommandOptionDefinition}
     */
    size: {
        name: "size",
        aliases: ["sz"],
        description: strings.SIZE,
        type: "string"
    },
    /**
     * The like value of data set
     * @type {ICommandOptionDefinition}
     */
    like: {
        name: "like",
        aliases: ["lk"],
        description: strings.LIKE,
        type: "string"
    }
};

/**
 * Object containing all options to be used by the Create API
 */
export const ZosFilesCreateOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The volume serial
     * @type {ICommandOptionDefinition}
     */
    volser: {
        name: "volume-serial",
        aliases: ["vs","volser"],
        description: strings.VOLSER,
        type: "string"
    },

    /**
     * The device type
     * @type {ICommandOptionDefinition}
     */
    unit: {
        name: "device-type",
        aliases: ["dt","unit"],
        description: strings.UNIT,
        type: "string"
    },

    /**
     * The data set organization
     * @type {ICommandOptionDefinition}
     */
    dsorg: {
        name: "data-set-organization",
        aliases: ["dso","dsorg"],
        description: strings.DSORG,
        type: "string"
    },

    /**
     * The unit of space allocation
     * @type {ICommandOptionDefinition}
     */
    alcunit: {
        name: "allocation-space-unit",
        aliases: ["asu"],
        description: strings.ALCUNIT,
        type: "string"
    },

    /**
     * The primary space allocation
     * @type {ICommandOptionDefinition}
     */
    primary: {
        name: "primary-space",
        aliases: ["ps"],
        description: strings.PRIMARY,
        type: "number"
    },

    /**
     * The secondary space allocation
     * @type {ICommandOptionDefinition}
     */
    secondary: {
        name: "secondary-space",
        aliases: ["ss"],
        description: strings.SECONDARY,
        type: "number"
    },

    /**
     * The number of directory blocks
     * @type {ICommandOptionDefinition}
     */
    dirblk: {
        name: "directory-blocks",
        aliases: ["db","dirblks"],
        description: strings.DIRBLK,
        type: "number"
    },

    /**
     * The average block
     * @type {ICommandOptionDefinition}
     */
    avgblk: {
        name: "average-blocks",
        aliases: ["ab"],
        description: strings.AVGBLK,
        type: "number"
    },

    /**
     * The record format
     * @type {ICommandOptionDefinition}
     */
    recfm: {
        name: "record-format",
        aliases: ["rf","recfm"],
        description: strings.RECFM,
        type: "string"
    },

    /**
     * The block size
     * @type {ICommandOptionDefinition}
     */
    blksize: {
        name: "block-size",
        aliases: ["bs","blksize"],
        description: strings.BLKSIZE,
        type: "number"
    },

    /**
     * The record length
     * @type {ICommandOptionDefinition}
     */
    lrecl: {
        name: "record-length",
        aliases: ["rl","lrecl"],
        description: strings.LRECL,
        type: "number"
    },

    /**
     * The storage class
     * @type {ICommandOptionDefinition}
     */
    storclass: {
        name: "storage-class",
        aliases: ["sc"],
        description: strings.STORCLASS,
        type: "string"
    },

    /**
     * The management class
     * @type {ICommandOptionDefinition}
     */
    mgntclass: {
        name: "management-class",
        aliases: ["mc"],
        description: strings.MGNTCLASS,
        type: "string"
    },

    /**
     * The data class
     * @type {ICommandOptionDefinition}
     */
    dataclass: {
        name: "data-class",
        aliases: ["dc"],
        description: strings.DATACLASS,
        type: "string"
    },

    /**
     * The data set type
     * @type {ICommandOptionDefinition}
     */
    dsntype: {
        name: "data-set-type",
        aliases: ["dst","dsntype"],
        description: strings.DSNTYPE,
        type: "string"
    }
};
