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
 * Job interface for when a job is submitted
 * @export
 * @interface IJobSubmit
 */
export interface IJobSubmit {

    /**
     * job id for a job
     * @type {string}
     * @memberof IJob
     */
    jobid: string;

    /**
     * job name for a job
     * @type {string}
     * @memberof IJob
     */
    jobname: string;

    /**
     * status of the job
     * @type {string}
     * @memberof IJob
     */
    status: string;

    /**
     * return code of the job
     * @type {string}
     * @memberof IJob
     */
    retcode: string;
}
