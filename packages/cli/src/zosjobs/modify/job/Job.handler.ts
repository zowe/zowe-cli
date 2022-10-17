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
import { ModifyJobs, GetJobs, IJob } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs modify job" command handler. Modify a job by name and ID.
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
     * Command handler process - invoked by the command processor to handle the "zos-jobs modify job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;

        // Force yargs parameters to be strings
        const jobname: string = this.arguments.jobname + "";
        const jobid: string = this.arguments.jobid + "";
        const hold: boolean = this.arguments.hold;
        const release: boolean = this.arguments.release;
        const showJob: boolean = this.arguments.showJob;

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);

        // Modify the job and print output
        const response = await ModifyJobs.modifyJob(this.mSession, jobname, jobid, this.arguments.jobClass, hold, release);
        this.data.setObj(job);
        if(showJob){
            const indentSpaces = 4;
            this.console.log("\nCURRENT JOB STATUS:\n"+JSON.stringify(job, null, indentSpaces));
        }
        
        this.console.log(response.message);
    }
}
