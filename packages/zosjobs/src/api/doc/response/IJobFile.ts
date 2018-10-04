/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

/**
 * Interface for a job dd
 * Represents the name and details of an output (spool) DD
 * for a z/OS batch job
 * @export
 * @interface IJobFile
 */
export interface IJobFile {

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
     * Record format of the spool file (DD)
     * @type {string}
     * @memberof IJobFile
     */
    recfm: string;

    /**
     * Total bytes in the spool file
     * @type {number}
     * @memberof IJobFile
     */
    "byte-count": number;

    /**
     * Total records (roughly equivalent to lines) in the spool file
     * @type {number}
     * @memberof IJobFile
     */
    "record-count": number;

    /**
     * unique identifier of job (substitute of job name and job id)
     * @type {string}
     * @memberof IJob
     */
    "job-correlator": string;

    /**
     * Job class for which job ran
     * @type {string}
     * @memberof IJobFile
     */
    class: string;

    /**
     * Identifier for this spool file.
     * each IJobFile for a single batch job will have a unique ID
     * @type {number}
     * @memberof IJobFileSimple
     */
    id: number;

    /**
     * DD name of job spool file
     * @type {string}
     * @memberof IJobFileSimple
     */
    ddname: string;

    /**
     * Direct access to job record content
     * @type {string}
     * @memberof IJobFile
     */
    "records-url": string;

    /**
     * Job DD lrecl (logical record length - how many bytes each record is)
     * @type {number}
     * @memberof IJobFile
     */
    lrecl: number;

    /**
     * The primary or secondary JES subsystem.
     * If this value is null, the job was processed by the primary subsystem.
     * @type {string}
     * @memberof IJobFile
     */
    subsystem: string;

    /**
     * The name of the job step during which this spool file was produced
     * @type {string}
     * @memberof IJobFileSimple
     */
    stepname: string;

    /**
     * If this spool file was produced during a job procedure step, the
     * name of the step will be here.
     * @type {string}
     * @memberof IJobStepData
     */
    procstep: string;
}
