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

import { IZosFilesResponse } from "../../../doc/IZosFilesResponse";

/**
 * Extra response data for all members download that includes result information
 */
export interface IDownloadAmResponse extends IZosFilesResponse {
    apiResponse: IZosFilesResponse['apiResponse'] & {
        downloadResult?: IDownloadAmResult;
    };
}

/**
 * This interface defines results of the download all members command.
 * @export
 */
export interface IDownloadAmResult {
    /**
     * Number of items successfully downloaded
     */
    downloaded: number;

    /**
     * Number of items skipped because they already exist
     */
    skipped: number;

    /**
     * Number of items that failed to download
     */
    failed: number;

    /**
     * Total number of items processed
     */
    total: number;

    /**
     * Names of items that were skipped
     */
    skippedMembers?: string[];

    /**
     * Names of items that failed
     */
    failedMembers?: string[];
}
