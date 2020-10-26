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

// job-info object (table 5)
import { IJobStatus } from "./IJobStatus";
import { IJobFiles } from "./IJobFiles";
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IJobInfo
 */
export interface IJobInfo{

    /**
     * Contains the jobstatus object, which contains details about the job.
     * @type {IJobStatus}
     * @memberof IJobInfo
     */
    jobstatus?: IJobStatus;

    /**
     * Contains an array of one or more objects with details about files created by the job.
     * @type {IJobFiles}
     * @memberof IJobInfo
     */
    jobfiles: IJobFiles;

}
