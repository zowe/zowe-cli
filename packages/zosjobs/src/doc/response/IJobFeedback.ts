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
 * Job feedback interface
 * @export
 * @interface IJobFeedback
 */
export interface IJobFeedback {
    response: import("c:/Users/at895452/Desktop/zowe-cli/packages/zosjobs/src/index").IJob;

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
     * job name for a job
     * @type {string}
     * @memberof IJob
     */
    holdStatus: string;

    /**
     * Original job id
     * @type {string}
     * @memberof IJobFeedback
     */
    "original-jobid": string;
    class: string;
    /**
     * job name for a job
     * @type {string}
     * @memberof IJob
     */
    /**
     * Job owner
     * @type {string}
     * @memberof IJobComplete
     */
    owner: string;

    /**
     * Member
     * @type {string}
     * @memberof IJobFeedback
     */
    member: string;

    /**
     * System name
     * @type {string}
     * @memberof IJobFeedback
     */
    sysname: string;

    /**
     * unique identifier of job (substitute of job name and job id)
     * @type {string}
     * @memberof IJob
     */
    "job-correlator": string;

    /**
     * status of the job
     * @type {string}
     * @memberof IJob
     */
    status: string;

    /**
     * Internal code
     * @type {string}
     * @memberof IJobFeedback
     */
    "internal-code": string;

    /**
     * Message
     * @type {string}
     * @memberof IJobFeedback
     */
    message: string;
}
