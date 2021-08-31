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
 * Defaults to be used as options for the different types of data sets that can be created
 */
export const CreateDefaults = {
    /**
     * Specifies all the defaults to create non-vsam data sets
     */
    DATA_SET: {
        /**
         * Specifies the defaults used by the Zos Files API to create a partitioned data set
         * @type {ICreateDataSetOptions}
         */
        PARTITIONED: {
            alcunit: "CYL",
            dsorg: "PO",
            primary: 1,
            dirblk: 5,
            recfm: "FB",
            blksize: 6160,
            lrecl: 80
        },

        /**
         * Specifies the defaults used by the Zos Files API to create a sequential data set
         * @type {ICreateDataSetOptions}
         */
        SEQUENTIAL: {
            alcunit: "CYL",
            dsorg: "PS",
            primary: 1,
            recfm: "FB",
            blksize: 6160,
            lrecl: 80
        },

        /**
         * Specifies the defaults used by the Zos Files API to create a classic data set
         * @type {ICreateDataSetOptions}
         */
        CLASSIC: {
            alcunit: "CYL",
            dsorg: "PO",
            primary: 1,
            recfm: "FB",
            blksize: 6160,
            lrecl: 80,
            dirblk: 25
        },

        /**
         * Specifies the defaults used by the Zos Files API to create a data set used for C code
         * @type {ICreateDataSetOptions}
         */
        C: {
            dsorg: "PO",
            alcunit: "CYL",
            primary: 1,
            recfm: "VB",
            blksize: 32760,
            lrecl: 260,
            dirblk: 25
        },

        /**
         * Specifies the defaults used by the Zos Files API to create a data set used for binaries
         * @type {ICreateDataSetOptions}
         */
        BINARY: {
            dsorg: "PO",
            alcunit: "CYL",
            primary: 10,
            recfm: "U",
            blksize: 27998,
            lrecl: 27998,
            dirblk: 25
        },

        /**
         * Specifies the defaults used by the Zos Files API to create a blank data set
         * @type {ICreateDataSetOptions}
         */
        BLANK: {}
    },
    /**
     * Specifies the defaults used by the Zos Files API to create a VSAM cluster
     * @type {ICreateVsamOptions}
     */
    VSAM: {
        dsorg: "INDEXED",
        alcunit: "KB",
        primary: 840
    }
};
