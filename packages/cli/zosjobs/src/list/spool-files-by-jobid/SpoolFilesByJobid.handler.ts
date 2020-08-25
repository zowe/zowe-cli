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
import { IJob } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { IJobFile } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs list spool-files" command handler. Outputs a table of spool files.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SpoolFilesHandler extends ZosmfBaseHandler {
    /**
     * The z/OSMF profile for this command
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private profile: any;

    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs list spool-files"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {

        this.arguments = params.arguments;

        // First obtain the details for the job (to acquire JOBNAME), then get the list of output spool files
        const job: IJob = await GetJobs.getJob(this.mSession, this.arguments.jobid);
        const files: IJobFile[] = await GetJobs.getSpoolFilesForJob(this.mSession, job);

        // Set the object, message, and log the prettified object
        this.data.setObj(files);
        this.data.setMessage(`"${files.length}" spool files obtained for job "${job.jobname}(${job.jobid})"`);

        // Format & print the response
        params.response.format.output({
            fields: ["id", "ddname", "procstep", "stepname"],
            output: files,
            format: "table"
        });
    }
}
