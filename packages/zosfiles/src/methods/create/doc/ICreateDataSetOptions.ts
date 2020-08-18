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

import { IZosFilesOptions } from "../../../doc/IZosFilesOptions";

/**
 * Interface for create dataset API
 *  zOSMF REST API information:
 *    https://www.ibm.com/support/knowledgecenter/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_CreateDataSet.htm#CreateDataSet
 * @export
 */
export interface ICreateDataSetOptions extends IZosFilesOptions {
    /**
     * The volume serial
     * @type {string}
     */
    volser?: string;

    /**
     * The device type
     * @type {string}
     */
    unit?: string;

    /**
     * The data set organization
     * @type {string}
     */
    dsorg?: string;

    /**
     * The unit of space allocation
     * @type {string}
     */
    alcunit?: string;

    /**
     * The primary space allocation
     * @type {number}
     */
    primary: number;

    /**
     * The secondary space allocation
     * @type {number}
     */
    secondary?: number;

    /**
     * The number of directory blocks
     * @type {number}
     */
    dirblk?: number;

    /**
     * The average block
     * @type {number}
     */
    avgblk?: number;

    /**
     * The record format
     * @type {string}
     */
    recfm?: string;

    /**
     * The block size
     * @type {number}
     */
    blksize?: number;

    /**
     * The record length
     * @type {number}
     */
    lrecl: number;

    /**
     * The storage class
     * @type {string}
     */
    storclass?: string;

    /**
     * The management class
     * @type {string}
     */
    mgntclass?: string;

    /**
     * The data class
     * @type {string}
     */
    dataclass?: string;

    /**
     * The data set type
     * @type {string}
     */
    dsntype?: string;

    /**
     * The indicator that we need to show the attributes
     *
     * DO NOT SEND THIS TO ZOSMF
     *
     * @type {boolean}
     */
    showAttributes?: boolean;

    /**
     * The abstraction of Allocation unit and Primary Space
     *
     * DO NOT SEND THIS TO ZOSMF
     *
     * @type {string}
     */
    size?: string;
}
