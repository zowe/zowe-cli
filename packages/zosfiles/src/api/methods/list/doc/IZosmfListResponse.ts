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
 * This interface defines the information that is stored in the download data set API return object
 */
export interface IZosmfListResponse extends IZosFilesOptions {


    /**
     * The name of the dataset
     */
    dsname: string;

    /**
     * The block size of the dataset
     */
    blksz?: string;

    /**
     * The catalog in which the dataset entry is stored
     */
    catnm?: string;

    /**
     * The dataset creation date
     */
    cdate?: string;

    /**
     * The type of the device the dataset is stored on
     */
    dev?: string;

    /**
     * The type of the dataset
     */
    dsntp?: string;

    /**
     * The organization of the data set as physical sequential (PS), partitioned (PO), or direct (DA)
     */
    dsorg?: string;

    /**
     * The dataset expiration date
     */
    edate?: string;

    /**
     * The number of extensions the dataset has
     */
    extx?: string;

    /**
     * The length, in bytes, of each record in the data set
     */
    lrecl?: string;

    /**
     * Indicates if automatic migration to a lower level of storage is active for this dataset
     */
    migr?: string;

    /**
     * Indicates if the dataset is multivolume
     */
    mvol?: string;

    /**
     * Open virtualization format
     */
    ovf?: string;

    /**
     * The date of the last time the dataset was referred to
     */
    rdate?: string;

    /**
     * The record format of the dataset
     */
    recfm?: string;

    /**
     * The size of the first extent in tracks
     */
    sizex?: string;

    /**
     * The type of space units measurement
     */
    spacu?: string;

    /**
     * The percentage of used space in the dataset
     */
    used?: string;

    /**
     * The volume name on which the dataset is stored
     */
    vol: string;

}
