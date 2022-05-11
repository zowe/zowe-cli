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
import { IJob, GetJobs, IJobFile, ISpoolFile } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

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
    public async processCmd(params: IHandlerParameters): Promise<void> {

        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, this.mArguments.jobid);
        // Get spool files
        const spoolFiles: IJobFile[] = await GetJobs.getSpoolFilesForJob(this.mSession, job);
        const responseArray: ISpoolFile[] = [];

        for (const spoolFile of spoolFiles) {
            const spoolContent = await GetJobs.getSpoolContent(this.mSession, spoolFile);
            if (spoolFile.procstep != null && spoolFile.procstep.length > 0) {
                this.console.log("Spool file: %s (ID #%d, Step: %s, ProcStep: %s)",
                    spoolFile.ddname, spoolFile.id, spoolFile.stepname, spoolFile.procstep);
            } else {
                this.console.log("Spool file: %s (ID #%d, Step: %s)",
                    spoolFile.ddname, spoolFile.id, spoolFile.stepname);
            }
            this.console.log(spoolContent);
            responseArray.push({
                id: spoolFile.id,
                ddName: spoolFile.ddname,
                stepName: spoolFile.stepname,
                procName: spoolFile.procstep,
                data: spoolContent.toString(),
            });
        }

        // Return as an object when using --response-format-json
        // This differs from the initial implementation, but we should probably return more then the last spool file.
        this.data.setObj(responseArray);
    }
}
