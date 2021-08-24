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

import { IHandlerParameters } from "@zowe/imperative";
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
        const modifyVersion: "1.0" | "2.0" = this.arguments.modifyVersion;

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);
        // Delete the job
        await DeleteJobs.deleteJobForJob(this.mSession, job, modifyVersion);

        const message: string = `Successfully deleted job ${job.jobname} (${jobid})`;
        // Print message to console
        this.console.log(message);

        // Return as an object when using --response-format-json
        this.data.setMessage(message);
        this.data.setObj(job);
    }
}
