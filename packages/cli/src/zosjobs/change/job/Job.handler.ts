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

import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import { ChangeJobs, GetJobs, IJob } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs change job" command handler. Change a job by ID.
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
     * Command handler process - invoked by the command processor to handle the "zos-jobs change job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        // Force yargs parameters to be strings
        const jobname: string = this.arguments.jobname + "";
        const jobid: string = this.arguments.jobid + "";
        const jobclass: string = this.arguments.jobclass + "";
        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);

        // Change the job
        const response = await ChangeJobs.changeJob(this.mSession, jobname, jobid, jobclass);
<<<<<<< HEAD
        this.data.setObj(job)
        this.console.log(response.message);
=======
        let message: string;

        // Print message to console
        this.console.log(message);

        // Return as an object when using --response-format-json
        this.data.setMessage(message);
        this.data.setObj(job);
>>>>>>> 5c7dbbb2ee5046b01f42f189dd12a29bad491dfe
    }
}
