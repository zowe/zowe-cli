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

/**
 * Constants to be used by the API
 * @memberOf ZosFilesConstants
 */
export const ZosFilesConstants: { [key: string]: any } = {
    /**
     * Specifies the z/OS data set and file REST interface
     * @type {string}
     */
    RESOURCE: "/zosmf/restfiles",

    /**
     * Indicator of a data set request
     * @type {string}
     */
    RES_DS_FILES: "/ds",

    /**
     * Indicator of a USS File request
     * @type {string}
     */
    RES_USS_FILES: "/fs",

    /**
     * Indicator of a z/OS file system request
     * @type {string}
     */
    RES_ZFS_FILES: "/mfs/zfs",

    /**
     * Indicator of a members request
     * @type {string}
     * @memberOf ZosFilesConstants
     */
    RES_DS_MEMBERS: "/member",

    /**
     * Indicator of an AMS request
     * @type {string}
     */
    RES_AMS: "/ams",

    /**
     * Indicator of a USS File request
     * @type {string}
     * @memberOf ZosFilesConstants
     */
    RES_PATH: "path",

    /**
     * Indicator of a ds file name
     * @type {string}
     * @memberOf ZosFilesConstants
     */
    RES_FSNAME: "fsname",

    /**
     * Indicator the query parameters used to qualify the request
     */
    RES_DS_LEVEL: "dslevel",

    /**
     * Maximum value for primary and secondary allocation
     * @type {number}
     */
    MAX_ALLOC_QUANTITY: 16777215,

    /**
     * Maximum length of an AMS statement
     * @type {number}
     */
    MAX_AMS_LINE: 255,

    /**
     * Maximum numbers of characters to allow for the continuation character on AMS statements
     * @type {number}
     */
    MAX_AMS_BUFFER: 2,

    /**
     * Minimum numbers of days for which to retain a dataset.
     * @type {number}
     */
    MIN_RETAIN_DAYS: 0,

    /**
     * Maximum numbers of days for which to retain a dataset.
     * @type {number}
     */
    MAX_RETAIN_DAYS: 93000,

    /**
     * The set of dataset organization choices for VSAM files
     * @type {[string]}
     */
    VSAM_DSORG_CHOICES: ["INDEXED", "IXD", "LINEAR", "LIN", "NONINDEXED", "NIXD", "NUMBERED", "NUMD", "ZFS"],

    /**
     * The set of allocation unit choices for VSAM files
     * @type {[string]}
     */
    VSAM_ALCUNIT_CHOICES: ["CYL", "TRK", "MB", "KB", "REC"],
};
