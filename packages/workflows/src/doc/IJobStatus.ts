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

// jobstatus object (table 6)
/**
 * Interface for z/OSMF API response.
 * @export { _class as class }
 * @interface IJobStatus
 */
export interface IJobStatus{

    /**
     * Job completion code.
     * @type {string}
     * @memberof IJobStatus
     */
    retcode?: string;

    /**
     * Job name.
     * @type {string}
     * @memberof IJobStatus
     */
    jobname: string;

    /**
     * Job status.
     * @type {string}
     * @memberof IJobStatus
     */
    status?: string;

    /**
     * User ID associated with the job.
     * @type {string}
     * @memberof IJobStatus
     */
    owner: string;

    /**
     * The primary or secondary JES subsystem.
     * @type {string}
     * @memberof IJobStatus
     */
    subsystem?: string;

    // class
    /**
     * Job execution class.
     * @type {string}
     * @export { _class as class }
     * @memberof IJobStatus
     */
    _class: string;

    /**
     * Job type.
     * @type {string}
     * @memberof IJobStatus
     */
    type: string;

    /**
     * Job identifier.
     * @type {string}
     * @memberof IJobStatus
     */
    jobid: string;
}
