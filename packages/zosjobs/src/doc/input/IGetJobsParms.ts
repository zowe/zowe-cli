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
 * Interface for various GetJobs APIs
 * @export
 * @interface IGetJobsParms
 */
export interface IGetJobsParms {

    /**
     * Owner for which to obtain jobs for.
     * Default: current user
     * @type {string}
     * @memberof IGetJobsParms
     */
    owner?: string;

    /**
     * Prefix to filter when obtaining jobs.
     * Default: *
     * @type {string}
     * @memberof IGetJobsParms
     */
    prefix?: string;

    /**
     * Max jobs to return in a list
     * Default: JobsConstants.DEFAULT_MAX_JOBS
     * @type {number}
     * @memberof IGetJobsParms
     */
    maxJobs?: number;

    /**
     * job id for a job
     * @type {string}
     * @memberof IJob
     */
    jobid?: string;

    /**
     * Return execution data about jobs
     * @type {boolean}
     * @memberof IGetJobsParms
     */
    execData?: boolean;
}
