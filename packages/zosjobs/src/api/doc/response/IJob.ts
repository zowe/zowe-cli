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

import { IJobStepData } from "./../../../../../zosjobs";

/**
 * Standard job response document
 * Represents the attributes and status of a z/OS batch job
 * @export
 * @interface IJob
 */
export interface IJob {

    /**
     * job id for a job
     * Uniquely identifies a job on a z/OS system
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
     * The primary or secondary JES subsystem.
     * If this value is null, the job was processed by the primary subsystem.
     * @type {string}
     * @memberof IJob
     */
    subsystem: string;

    /**
     * owner of the job
     * @type {string}
     * @memberof IJob
     */
    owner: string;

    /**
     * status of the job
     * @type {string}
     * @memberof IJob
     */
    status: string;

    /**
     * type of job
     * @type {string}
     * @memberof IJob
     */
    type: string;

    /**
     * job class
     * @type {string}
     * @memberof IJob
     */
    class: string;

    /**
     * return code of the job
     * @type {string}
     * @memberof IJob
     */
    retcode: string;

    /**
     * detailed job step data
     * @type {IJobStepData[]}
     * @memberof IJob
     */
    "step-data"?: IJobStepData[];

    /**
     * url for direct reference of job info
     * @type {string}
     * @memberof IJob
     */
    url: string;

    /**
     * spool files url for direct reference
     * @type {string}
     * @memberof IJob
     */
    "files-url": string;

    /**
     * unique identifier of job (substitute of job name and job id)
     * If this value is null, the job was submitted to JES3.
     * @type {string}
     * @memberof IJob
     */
    "job-correlator": string;

    /**
     * job phase
     * @type {number}
     * @memberof IJob
     */
    phase: number;

    /**
     * job phase name
     * @type {string}
     * @memberof IJob
     */
    "phase-name": string;

    /**
     * explaination of error
     * @type {string}
     * @memberof IJob
     */
    "reason-not-running"?: string;
}
