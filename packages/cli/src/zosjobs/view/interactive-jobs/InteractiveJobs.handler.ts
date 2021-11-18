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
import { IJob, GetJobs, JobsConstants, IJobFile } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs view job-status-by-jobid" command handler. Outputs details regarding a z/OS job.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class InteractiveJobsHandler extends ZosmfBaseHandler {
    /**
     * Handler for the "zos-jobs list jobs" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        // Obtain the list of jobs - by default uses the session user and * for owner and prefix.
        const owner: string = (params.arguments.owner != null) ? params.arguments.owner : null;
        const prefix: string = (params.arguments.prefix != null) ? params.arguments.prefix : JobsConstants.DEFAULT_PREFIX;
        const jobs: IJob[] = await GetJobs.getJobsCommon(this.mSession, { owner, prefix });

        const formatter: any = params.response.format;
        const inputFields = params.arguments.rff?.toString().split(";");

        const jobTable: string[] = formatter.formatOutput({
            // Fields:  owner phase subsystem phase-name job-correlator type url jobid class files-url jobname status retcode
            fields: inputFields?.[0].split(',') ?? ["jobid", "retcode", "jobname", "status"],
            output: jobs,
            format: "table",
            header: true
        }).split("\n");
        const jobIndex = await params.response.console.interactiveSelection(jobTable, { header: jobTable.shift() });
        params.response.console.log("Selected job:", jobs[jobIndex - 1].jobid, "\n");

        const files: IJobFile[] = await GetJobs.getSpoolFilesForJob(this.mSession, jobs[jobIndex - 1]);
        const fileIndex = await params.response.console.interactiveSelection(files, {
            fields: inputFields?.[1].split(',') ?? ["id", "ddname", "procstep", "stepname"]
        });
        params.response.console.log("Selected spool file:", files[fileIndex - 1].ddname, "\n");

        // Get the content, set the JSON response object, and print
        const file = files[fileIndex - 1];
        const content: string = await GetJobs.getSpoolContentById(this.mSession, file.jobname, file.jobid, file.id);

        params.response.data.setObj(content);
        params.response.console.log(Buffer.from(content));
        params.response.console.log("\n", `Spool file "${file.ddname}" content obtained for job "${file.jobname}(${file.jobid})"`);
    }
}
