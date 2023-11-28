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

import { AbstractSession, Headers, Logger} from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { GetJobs} from "./GetJobs";
import { IJobFile } from "./doc/response/IJobFile";
import { IJob } from "./doc/response/IJob";
import { JobsConstants } from "./JobsConstants";

/**
 * Class to handle the searching of z/OS batch job spool output
 * @export
 * @class SearchJobs
 */
export class SearchJobs {

    /**
     * Get jobs (defaults to the user ID of the session as owner)
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} searchString - The string to search for in the spool output
     * @returns {Promise<string>} - promise that resolves to spool output
     * @memberof searchJobs
     */
    public static async searchJobs(session: AbstractSession, jobid: string, searchString: string) {
        Logger.getAppLogger().info("SearchJobs.searchJobs() called!");
        let replyBuffer:string = "";

        const jobsList: IJob[] = await GetJobs.getJobsByPrefix(session, jobid);
        for(const job of jobsList )
        {
            // Get spool files
            const spoolFiles: IJobFile[] = await GetJobs.getSpoolFilesForJob(session, job);

            for (const spoolFile of spoolFiles) {
                const spoolContent = await this.searchSpoolContentCommon(session, searchString, spoolFile);
                if(spoolContent.length > 0){
                    if (spoolFile.procstep != null && spoolFile.procstep.length > 0) {
                        replyBuffer = replyBuffer + "Job Name: " + job.jobname + " Job Id: " + job.jobid +
                            " Spool file: " + spoolFile.ddname + "(ID #" + spoolFile.id + " Step: " +
                            spoolFile.stepname + " ProcStep: " + spoolFile.procstep +")" + "\n";

                    } else {
                        replyBuffer = replyBuffer + "Job Name: " + job.jobname + " Job Id: " + job.jobid +
                            " Spool file: " + spoolFile.ddname + "(ID #" + spoolFile.id + " Step: " +
                            spoolFile.stepname + ")" + "\n";
                    }                
                    replyBuffer = replyBuffer + spoolContent + "\n";
                }
            }
        }

        return replyBuffer;
    }

    private static async searchSpoolContentCommon(session: AbstractSession, searchString : string, jobFile: IJobFile) {
        Logger.getAppLogger().trace("GetJobs.getSpoolContentCommon()");

        let parameters: string = "/" + encodeURIComponent(jobFile.jobname) + "/" + encodeURIComponent(jobFile.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + encodeURIComponent(jobFile.id) + JobsConstants.RESOURCE_SPOOL_CONTENT;

        parameters += "?search=" + searchString + "&maxreturnsize=1";
        return ZosmfRestClient.getExpectString(session, JobsConstants.RESOURCE + parameters, [Headers.TEXT_PLAIN_UTF8]);
    }

}
