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
 * Interface for downloading all spool content with DownloadJobs API
 * @export
 * @interface IDownloadAllSpoolContentParms
 */
export interface IDownloadAllSpoolContentParms {

    /**
     * The directory to which you would like to download the output
     * Default value: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    outDir?: string;

    /**
     * Name of the job for which you want to download all output
     * e.g. MYJOBNM
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    jobname: string;

    /**
     * JOB ID of the job for which you want to download all output
     * e.g. JOB00001
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    jobid: string;

    /**
     * If you specify false or do not specify this field, a directory with the jobid of the job as the name
     * will automatically be appended to the outDir.
     * If you specify true, no directory will be appended to your outDir.
     * @type {boolean}
     * @memberof IDownloadAllSpoolContentParms
     */
    omitJobidDirectory?: boolean;

    /**
     * The extension to use for the files. Defaults to `.txt`
     * e.g. .log
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    extension?: string;

    /**
     * If you specify true for this field, the file will be downloaded in binary mode
     * @type {boolean}
     * @memberof IDownloadSpoolContentParms
     */
    binary?: boolean;

    /**
     * If you specify true for this field, the file will be downloaded in record mode
     * @type {boolean}
     * @memberof IDownloadSpoolContentParms
     */
    record?: boolean;

    /**
     * The codepage to use for translation from EBCDIC
     * @type {string}
     * @memberof IDownloadSpoolContentParms
     */
    encoding?: string;

    /**
     * Optional record range
     * e.g. 0-100
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    recordRange?: string;

    /**
     * Wait for the job to reach output status
     */
    waitForActive?: boolean;


    /**
     * Wait for the job to reach output status
     */
    waitForOutput?: boolean;
}
