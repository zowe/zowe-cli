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

import { IHandlerParameters, ImperativeError } from "npm:@zowe/imperative";
import { DeleteJobs, GetJobs, IJob } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs delete job" command handler. Delete (purge) a job by ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
export default class JobHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs delete job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        // Force yargs `jobid` parameter to be a string
        const jobid: string = this.arguments.jobid + "";

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);
        // Delete the job
        const response = await DeleteJobs.deleteJobForJob(this.mSession, job, this.arguments.modifyVersion);

        let message: string;
        if (this.arguments.modifyVersion == null || this.arguments.modifyVersion === "1.0") {
            message = `Successfully submitted request to delete job ${job.jobname} (${jobid})`;
        } else if (this.arguments.modifyVersion === "2.0" && response?.status === "0") {
            message = `Successfully deleted job ${job.jobname} (${jobid})`;
        } else {
            throw new ImperativeError({
                msg: `Failed to delete job ${job.jobname} (${jobid})`,
                additionalDetails: response?.message,
                errorCode: response?.["internal-code"]
            });
        }

        // Print message to console
        this.console.log(message);

        // Return as an object when using --response-format-json
        this.data.setMessage(message);
        this.data.setObj(job);
    }
}
