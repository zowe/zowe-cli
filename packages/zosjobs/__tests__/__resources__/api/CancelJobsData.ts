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

import {IJobFeedback} from "../../../src/doc/response/IJobFeedback";

/**
 * Static class for GetJobs data
 * @export
 * @class GetJobsData
 */
export class CancelJobsData {

    /**
     * Sample Job Feedback
     * @static
     * @type {IJobFeedback}
     * @memberof CancelJobsData
     */
    public static readonly SAMPLE_JOB_FEEDBACK_GOOD: IJobFeedback = {
        "jobid": "TSUxxx",
        "jobname": "IBMUSER$",
        "original-jobid": "TSUxxx",
        "owner": "IBMUSER",
        "member": "JES2",
        "sysname": "SY1",
        "job-correlator": "J0000000000.....C0000000.......",
        "status": "0",
        "internal-code": undefined,
        "message": undefined
    };

    /**
     * Sample Job Feedback
     * @static
     * @type {IJobFeedback}
     * @memberof CancelJobsData
     */
    public static readonly SAMPLE_JOB_FEEDBACK_BAD: IJobFeedback = {
        "jobid": "TSUxxx",
        "jobname": "IBMUSER$",
        "original-jobid": "TSUxxx",
        "owner": "IBMUSER",
        "member": "MEMBER",
        "sysname": "SYS",
        "job-correlator": "J0000000000.....C0000000.......",
        "status": "1",
        "internal-code": "S0C4",
        "message": "Internal Server Error"
    };

    /**
     * Sample Job Feedback
     * @static
     * @type {IJobFeedback}
     * @memberof CancelJobsData
     */
    public static readonly SAMPLE_JOB_FEEDBACK_ASYNC: IJobFeedback = {
        "jobid": undefined,
        "jobname": undefined,
        "original-jobid": undefined,
        "owner": undefined,
        "member": undefined,
        "sysname": undefined,
        "job-correlator": undefined,
        "status": "0",
        "internal-code": undefined,
        "message": undefined
    };
}