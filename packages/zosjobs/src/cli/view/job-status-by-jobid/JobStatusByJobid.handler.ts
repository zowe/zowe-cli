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

import { ICommandHandler, IHandlerParameters, Session } from "@brightside/imperative";
import { ZosmfSession } from "../../../../../zosmf";
import { IJob } from "../../../api/doc/response/IJob";
import { GetJobs } from "../../../api/GetJobs";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

/**
 * "zos-jobs view job-status-by-jobid" command handler. Outputs details regarding a z/OS job.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class JobStatusByJobidHandler extends ZosmfBaseHandler {

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view job-status-by-jobid"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    public async processWithSession(params: IHandlerParameters): Promise<void> {

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, this.mArguments.jobid);

        // Set the object, message, and log the prettified object
        this.data.setObj(job);
        this.data.setMessage(`Details obtained for job ${this.mArguments.jobid}`);

        // // Format the output with the default fields
        params.response.format.output({
            fields: ["jobid", "retcode", "jobname", "status"],
            output: job,
            format: "object"
        });
    }
}
