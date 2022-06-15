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
 * This interface defines results of the download data sets matching command.
 * @export
 * @interface IDownloadDsmResult
 */
export interface IDownloadDsmResult {
    /**
     * List of data set names that have downloaded successfully.
     */
    downloaded: string[];

    /**
     * List of data set names that failed to download because they are archived.
     */
    failedArchived: string[];

    /**
     * List of data set names that failed to download because they are an
     * unsupported type.
     */
    failedUnsupported: string[];

    /**
     * Object containing key-value pairs of data set names and errors for data
     * sets that failed to download.
     */
    failedWithErrors: { [key: string]: Error };
}
