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

import { IHandlerParameters, ImperativeExpect } from "@zowe/core-for-zowe-sdk";
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

        // Force yargs parameters to be proper types
        const jobid: string = this.arguments.jobid + "";
        const hold: boolean = this.arguments.hold;
        const release: boolean = this.arguments.release;

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);

        // Modify the job and print output
        const response = await ModifyJobs.modifyJob(this.mSession, {jobname: job.jobname, jobid}, {jobclass: this.arguments.jobclass, hold, release});
        ImperativeExpect.toNotBeNullOrUndefined(response,
            "You must specify at least one option to modify your job with.");
        this.data.setObj(job);
        let mergedMessage: string = "";
        if(this.arguments.jobclass){
            if(response.message.includes("Job class invalid")){
                mergedMessage = "\nUnsuccessful. Job class '"+this.arguments.jobclass+"' invalid";
            }else{
                mergedMessage = "\nSuccessful. Class Change: " + job.class + " -> " + this.arguments.jobclass;
            }
        }
        if(this.arguments.hold || this.arguments.release){
            if(this.arguments.hold){
                mergedMessage = mergedMessage + "\nSuccessful. Job Held";
            }else{
                mergedMessage = mergedMessage + "\nSuccessful. Job Released";
            }
        }
        this.console.log(mergedMessage);
    }
}
