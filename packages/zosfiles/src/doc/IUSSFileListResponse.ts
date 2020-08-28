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
 * This interface defines the information that is stored in the download data set API return object
 */
export interface IUSSFileListResponse {


    /**
     * The name of the dataset
     */
    name: string;

    /**
     * The block size of the dataset
     */
    mode?: string;

    /**
     * The catalog in which the dataset entry is stored
     */
    size?: string;

    /**
     * The dataset creation date
     */
    uid?: string;

    /**
     * The type of the device the dataset is stored on
     */
    user?: string;

    /**
     * The type of the dataset
     */
    gid?: string;


}
