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
 * This interface defines results of the download dir-from-uss command.
 * @export
 * @interface IDownloadUssDirResult
 */
export interface IDownloadUssDirResult {
    /**
     * List of file names that have downloaded successfully.
     */
    downloaded: string[];

    /**
     * Object containing key-value pairs of files and errors for uss files that failed to download.
     */
    failedWithErrors: { [key: string]: Error };
}
