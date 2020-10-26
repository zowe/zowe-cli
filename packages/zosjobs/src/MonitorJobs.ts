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

import { AbstractSession, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";
import { inspect } from "util";
import { GetJobs } from "./GetJobs";
import { JOB_STATUS, JOB_STATUS_ORDER } from "./types/JobStatus";
import { sleep } from "@zowe/core-for-zowe-sdk";
import { IJob } from "./doc/response/IJob";
import { IMonitorJobWaitForParms } from "./doc/input/IMonitorJobWaitForParms";

/**
 * APIs for monitoring the status of a job. Use these APIs to wait for a job to enter the specified status. All APIs
 * in monitor jobs invoke z/OSMF jobs REST endpoints to obtain job status information.
 * @export
 * @class MonitorJobs
 */
export class MonitorJobs {

    /**
     * The default amount of time (in milliseconds) to wait until the next job status poll.
     * @static
     * @memberof MonitorJobs
     */
    public static readonly DEFAULT_WATCH_DELAY = 3000; // 3000 is 3 seconds

    /**
     * Default expected job status ("OUTPUT")
     * @static
     * @memberof MonitorJobs
     */
    public static readonly DEFAULT_STATUS = JOB_STATUS.OUTPUT;

    /**
     * Default number of poll attempts to check for the specified job status.
     * @static
     * @memberof MonitorJobs
     */
    public static readonly DEFAULT_ATTEMPTS = Infinity;

    /**
     * Given an IJob (has jobname/jobid), waits for the status of the job to be "OUTPUT". This API will poll for
     * the OUTPUT status once every 3 seconds indefinitely. If the polling interval/duration is NOT sufficient, use
     * "waitForStatusCommon" to adjust.
     *
     * See JSDoc for "waitForStatusCommon" for full details on polling and other logic.
     *
     * @static
     * @param {AbstractSession} session - a Rest client session for z/OSMF
     * @param {IJob} job - the z/OS job to wait for (see z/OSMF Jobs APIs for details)
     * @returns {Promise<IJob>} - the promise to be fulfilled with IJob object (or rejected with an ImperativeError)
     * @memberof MonitorJobs
     */
    public static waitForJobOutputStatus(session: AbstractSession, job: IJob): Promise<IJob> {
        ImperativeExpect.toNotBeNullOrUndefined(job, "IJob object (containing jobname and jobid) required");
        return MonitorJobs.waitForStatusCommon(session, {jobname: job.jobname, jobid: job.jobid, status: JOB_STATUS.OUTPUT});
    }

    /**
     * Given the jobname/jobid, waits for the status of the job to be "OUTPUT". This API will poll for the OUTPUT status
     * once every 3 seconds indefinitely. If the polling interval/duration is NOT sufficient, use
     * "waitForStatusCommon" to adjust.
     *
     * See JSDoc for "waitForStatusCommon" for full details on polling and other logic.
     *
     * @static
     * @param {AbstractSession} session - a Rest client session for z/OSMF
     * @param {string} jobname - the z/OS jobname of the job to wait for output status (see z/OSMF Jobs APIs for details)
     * @param {string} jobid - the z/OS jobid of the job to wait for output status (see z/OSMF Jobs APIS for details)
     * @returns {Promise<IJob>} - the promise to be fulfilled with IJob object (or rejected with an ImperativeError)
     * @memberof MonitorJobs
     */
    public static waitForOutputStatus(session: AbstractSession, jobname: string, jobid: string): Promise<IJob> {
        return MonitorJobs.waitForStatusCommon(session, {jobname, jobid, status: JOB_STATUS.OUTPUT});
    }

    /**
     * Given jobname/jobid, checks for the desired "status" (default is "OUTPUT") continuously (based on the interval
     * and attempts specified).
     *
     * The "order" of natural job status is INPUT > ACTIVE > OUTPUT. If the requested status is earlier in the sequence
     * than the current status of the job, then the method returns immediately (since the job will never enter the
     * requested status) with the current status of the job.
     *
     * @static
     * @param {AbstractSession} session - a Rest client session for z/OSMF
     * @param {IMonitorJobWaitForParms} parms - monitor jobs parameters (see interface for details)
     * @returns {Promise<IJob>} - the promise to be fulfilled with IJob object (or rejected with an ImperativeError)
     * @memberof MonitorJobs
     */
    public static async waitForStatusCommon(session: AbstractSession, parms: IMonitorJobWaitForParms): Promise<IJob> {
        // Validate that required parameters are specified
        ImperativeExpect.toNotBeNullOrUndefined(parms, "IMonitorJobParms object required");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname"]);
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobid"]);
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        if (parms.status != null) {
            ImperativeExpect.toBeOneOf(parms.status, JOB_STATUS_ORDER);
        }
        if (parms.attempts != null) {
            ImperativeExpect.keysToBeOfType(parms, "number", ["attempts"]);
            if (parms.attempts < 0) {
                throw new ImperativeError({msg: `Expect Error: "attempts" must be a positive integer`});
            }
        }
        if (parms.watchDelay != null) {
            ImperativeExpect.keysToBeOfType(parms, "number", ["watchDelay"]);
            if (parms.watchDelay < 0) {
                throw new ImperativeError({msg: `Expect Error: "watchDelay" must be a positive integer`});
            }
        }

        // Log the API call (& full parms at trace level)
        this.log.info(`Monitor Jobs - "waitForStatusCommon" API request: ` +
            `jobname ${parms.jobname}, jobid ${parms.jobid}, attempts ${parms.attempts}, watch delay ${parms.watchDelay}`);
        this.log.trace(`Parameters:\n${inspect(parms)}`);

        // set defaults if not supplied
        if (parms.status == null) {
            parms.status = MonitorJobs.DEFAULT_STATUS;
        }
        if (parms.attempts == null) {
            parms.attempts = MonitorJobs.DEFAULT_ATTEMPTS;
        }

        // Wait for the expected status (or timeout)
        let response;
        try {
            response = await MonitorJobs.pollForStatus(session, parms);
        } catch (pollStatusErr) {

            // If a poll error occurred - reject the promise
            if (pollStatusErr instanceof ImperativeError) {
                const details = pollStatusErr.mDetails;
                details.msg = this.constructErrorMsg(parms, pollStatusErr.message);
                this.log.error(`${details.msg}`);
                throw new ImperativeError(details);
            } else {
                const msg = this.constructErrorMsg(parms, pollStatusErr.message);
                this.log.error(`${msg}`);
                throw new ImperativeError({msg});
            }
        }

        // Return the response
        this.log.trace(`Monitor Jobs - "waitForStatusCommon" complete - found expected status of ${parms.status}`);
        return response;
    }

    /**
     * Obtain an instance of the app logger (Brightside).
     * @private
     * @static
     * @type {Logger}
     * @memberof MonitorJobs
     */
    private static log: Logger = Logger.getAppLogger();

    /**
     * "Polls" (sets timeouts and continuously checks) for the status of the job to match the desired status.
     * @private
     * @static
     * @param {AbstractSession} session - a Rest client session for z/OSMF
     * @param {IMonitorJobWaitForParms} parms - The monitor jobs parms (see interface for details)
     * @returns {Promise<IJob>} - Fulfill when the status changes as expected
     * @memberof MonitorJobs
     */
    private static async pollForStatus(session: AbstractSession, parms: IMonitorJobWaitForParms): Promise<IJob> {
        // Timeout value
        const timeoutVal = parms.watchDelay || MonitorJobs.DEFAULT_WATCH_DELAY;

        // Define loop control parameters
        let expectedStatus = false;
        let job: IJob;
        let attempt = 0;

        let shouldContinue = false;

        // Catch any errors that might happen in MonitorJobs.checkStatus.
        // Try instantiated outside the for loop because it gets created once for the entire
        // loop operation, as opposed to once per operation of the loop.
        try {
            do {
                // Check the status of the job
                attempt++;
                this.log.debug(`Polling for jobname "${parms.jobname}" jobid "${parms.jobid}" status "${parms.status}" ` +
                    `- attempt "${attempt}" (max attempts "${parms.attempts}") ...`);

                // Check the status of the job
                [expectedStatus, job] = await MonitorJobs.checkStatus(session, parms);

                // Logic is done this way because we don't need to sleep if we are
                // exiting the loop on this operation.
                shouldContinue = !expectedStatus &&
                    (parms.attempts > 0 && attempt < parms.attempts);

                // Wait for the next poll if we didn't get the proper status.
                if(shouldContinue) {
                    // Set a timer which will check the status on expiry
                    this.log.trace(`Setting timeout for next poll...`);
                    await sleep(timeoutVal);
                }
            } while (shouldContinue);
        } catch(e) {
            this.log.error("Received error while polling");
            this.log.error(e);
            throw e;
        }

        // One of the conditions that will cause the loop to end. If this specific
        // condition was encountered, then we timed out and exhausted all of our attempts
        // without successfully retrieving the job.
        if (!expectedStatus && parms.attempts > 0 && attempt >= parms.attempts) {
            throw new ImperativeError({
                msg: `Error Details: Reached max poll attempts of "${parms.attempts}"`
            });
        }

        // The only way we get here is by successfully getting the job.
        this.log.debug(`Expected status "${parms.status}" found for jobname "${parms.jobname}" jobid "${parms.jobid}" ` +
            `- attempt "${attempt}" (max attempts "${parms.attempts}") ...`);
        return job;
    }

    /**
     * Checks the status of the job for the expected status (OR that the job has progressed passed the expected status).
     * @private
     * @static
     * @param {AbstractSession} session - the session to initiate the z/OSMF getJobStatus request
     * @param {IMonitorJobWaitForParms} parms - the monitor jobs parameters containing the jobname, jobid, status, etc.
     * @returns {Promise<boolean>} - promise to fulfill when the job status is obtained (or imperative error)
     * @memberof MonitorJobs
     */
    private static async checkStatus(session: AbstractSession, parms: IMonitorJobWaitForParms): Promise<[boolean, IJob]> {
        // Log an get the status of the job
        this.log.debug(`Checking for "${parms.status}" status for jobname "${parms.jobname}", jobid "${parms.jobid}"...`);
        const job: IJob = await GetJobs.getStatusCommon(session, parms);
        this.log.debug(`jobname "${parms.jobname}" jobid "${parms.jobid}" has current status of "${job.status}".`);

        // Ensure that the job status is defined & known
        if (job.status == null || JOB_STATUS_ORDER.indexOf(job.status.toUpperCase() as JOB_STATUS) < 0) {
            this.log.error(`An unknown status of "${job.status}" for jobname ${job.jobname}, jobid ${job.jobid}, was received.`);
            throw new ImperativeError({
                msg: `Error Details: An unknown status "${job.status}" was received.`
            });
        }

        // If the status matches exactly OR the jobs current status is further than the requested status (for
        // example, if the jobs status is ACTIVE and the requested status is INPUT) fulfill.
        if (JOB_STATUS_ORDER.indexOf(job.status as JOB_STATUS) >= JOB_STATUS_ORDER.indexOf(parms.status)) {
            this.log.debug(`The current status (${job.status}) for jobname ${job.jobname}, jobid ${job.jobid} ` +
                `is greater than or equal to the expected of "${parms.status}"`);
            return [true, job];
        }

        return [false, job];
    }

    /**
     * Constructs the default error message (to be thrown via ImperativeError) for the monitor jobs APIs
     * @private
     * @static
     * @param {IMonitorJobWaitForParms} parms - The parameters passed to the API
     * @param {string} details - Additional error details string
     * @returns {string} - The error string to be thrown via ImperativeError
     * @memberof MonitorJobs
     */
    private static constructErrorMsg(parms: IMonitorJobWaitForParms, details: string): string {
        return `Error obtaining status for jobname "${parms.jobname}" jobid "${parms.jobid}".\n${details}`;
    }
}
