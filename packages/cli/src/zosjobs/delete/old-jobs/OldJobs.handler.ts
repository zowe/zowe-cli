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

import { IHandlerParameters, ImperativeError } from "@zowe/core-for-zowe-sdk";
import { asyncPool } from "@zowe/core-for-zowe-sdk";
import { DeleteJobs, GetJobs, IJob, JobsConstants, JOB_STATUS } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs delete old-jobs" command handler. Delete (purge) multiple jobs in OUTPUT status.
 * @export
 * @class OldJobsHandler
 * @implements {ICommandHandler}
 */
export default class OldJobsHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof OldJobsHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs delete job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OldJobsHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        // Retrieve the list of user's jobs
        const prefix: string = this.arguments.prefix || JobsConstants.DEFAULT_PREFIX;
        const jobs: IJob[] = await GetJobs.getJobsByPrefix(this.mSession, prefix);

        // Handle no jobs
        if (jobs.length === 0) {
            let notFoundMessage: string = "No jobs found";
            if (prefix != null && prefix.length > 0) {
                notFoundMessage += ` with prefix ${prefix}`;
            }
            this.console.log(notFoundMessage);
            return;
        }

        // Loop through the jobs and delete those in OUTPUT status
        const deletedJobs: IJob[] = [];
        for (const job of jobs) {
            if (job.status === JOB_STATUS.OUTPUT) {
                deletedJobs.push(job);
            }
        }
        const deleteJobPromise = async (job: IJob) => {
            const response = await DeleteJobs.deleteJobForJob(this.mSession, job, this.arguments.modifyVersion);
            if (response != null && response.status !== "0") {
                throw new ImperativeError({
                    msg: `Failed to delete job ${job.jobname} (${job.jobid})`,
                    additionalDetails: response?.message,
                    errorCode: response?.["internal-code"]
                });
            }
        };
        if (this.arguments.maxConcurrentRequests === 0) {
            await Promise.all(deletedJobs.map(deleteJobPromise));
        } else {
            await asyncPool(this.arguments.maxConcurrentRequests, deletedJobs, deleteJobPromise);
        }

        const message: string = `Successfully deleted ${deletedJobs.length} job${deletedJobs.length === 1 ? "" : "s"}`;
        // Format the output
        this.console.log(message);
        params.response.format.output({
            fields: ["jobname", "jobid", "status"],
            output: deletedJobs,
            format: "table"
        });

        // Return as an object when using --response-format-json
        this.data.setMessage(message);
        this.data.setObj(deletedJobs);
    }
}
