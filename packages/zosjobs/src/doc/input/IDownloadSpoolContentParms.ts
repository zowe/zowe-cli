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

import { IJobFile } from "../response/IJobFile";
import { IDownloadAllSpoolContentParms } from "./IDownloadAllSpoolContentParms";

/**
 * Interface for downloading single spool file with DownloadJobs API
 * @export
 * @interface IDownloadAllSpoolContentParms
 */
export interface IDownloadSpoolContentParms extends Omit<IDownloadAllSpoolContentParms, "jobname" | "jobid">{

    /**
     * Job file document for job output we want to download
     * @type {IJobFile}
     * @memberof IDownloadSpoolContentParms
     */
    jobFile?: IJobFile;

    /**
     * Name of the job for which you want to download all output
     * e.g. MYJOBNM
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    jobname?: string;

    /**
     * JOB ID of the job for which you want to download all output
     * e.g. JOB00001
     * @type {string}
     * @memberof IDownloadAllSpoolContentParms
     */
    jobid?: string;

}
