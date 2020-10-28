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
import { IJob, GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs view spool-by-id" command handler. Outputs a single spool DD contents.
 * @export
 * @class SubmitJobHandler
 */
export default class SpoolFileByIdHandler extends ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {

        // Get the job details and spool files
        const job: IJob = await GetJobs.getJob(this.mSession, this.mArguments.jobid);

        // Get the content, set the JSON response object, and print
        const content: string = await GetJobs.getSpoolContentById(this.mSession, job.jobname, job.jobid, this.mArguments.spoolfileid);
        this.data.setObj(content);
        this.data.setMessage(`Spool file "${this.mArguments.spoolfileid}" content obtained for job "${job.jobname}(${job.jobid})"`);
        this.console.log(Buffer.from(content));
    }
}
