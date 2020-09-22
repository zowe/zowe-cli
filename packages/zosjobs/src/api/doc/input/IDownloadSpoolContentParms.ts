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

import { IJobFile } from "../../../../../zosjobs";

/**
 * Interface for downloading single spool file with DownloadJobs API
 * @export
 * @interface IDownloadAllSpoolContentParms
 */
export interface IDownloadSpoolContentParms {

    /**
     * The directory to which you would like to download the output
     * Default value: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR
     * @type {string}
     * @memberof IDownloadSpoolContentParms
     */
    outDir?: string;

    /**
     * Alternate current working directory
     * @type {string}
     * @memberof IDownloadSpoolContentParms
     */
    cwd?: string;

    /**
     * Job file document for job output we want to download
     * @type {IJobFile}
     * @memberof IDownloadSpoolContentParms
     */
    jobFile?: IJobFile;

    /**
     * If you specify false or do not specify this field, a directory with the jobid of the job as the name
     * will automatically be appended to the outDir.
     * If you specify true, no directory will be appended to your outDir.
     * @type {boolean}
     * @memberof IDownloadSpoolContentParms
     */
    omitJobidDirectory?: boolean;
}
