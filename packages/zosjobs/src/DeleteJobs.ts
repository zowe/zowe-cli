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

import { AbstractSession, ImperativeExpect, IO, Logger } from "@zowe/imperative";
import { JobsConstants } from "./JobsConstants";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IJob } from "./doc/response/IJob";
import { IDeleteJobParms } from "./doc/input/IDeleteJobParms";

/**
 * Class to handle deletion of job information
 * @export
 * @class DeleteJobs
 */
export class DeleteJobs {

    /**
     * Cancel and purge a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - job name to be translated into parms object
     * @param {string} jobid - job id to be translated into parms object
     * @returns {Promise<void>} - promise that resolves when the API call is complete
     * @memberof DeleteJobs
     */
    public static async deleteJob(session: AbstractSession, jobname: string, jobid: string) {
        this.log.trace("deleteJob called with jobname %s jobid %s", jobname, jobid);
        return DeleteJobs.deleteJobCommon(session, {jobname, jobid});
    }

    /**
     * Cancel and purge a job
     * Alternative version of the delete API accepting an IJob object returned from other APIs such as GetJobs and SubmitJobs
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job that you want to delete
     * @param {"1.0"| "2.0"} modifyVersion - version of the X-IBM-Job-Modify-Version header to use (see ZosmfHeaders)
     * @returns {Promise<void>} -  promise that resolves when the API call is completel
     * @memberof DeleteJobs
     */
    public static async deleteJobForJob(session: AbstractSession, job: IJob, modifyVersion?: boolean) {
        this.log.trace("deleteJobForJob called with job %s", JSON.stringify(job));
        return DeleteJobs.deleteJobCommon(session, {jobname: job.jobname, jobid: job.jobid, modifyVersion});
    }

    /**
     * Cancel and purge a job
     * Full version of the API with a parameter object
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IDeleteJobParms} parms - parm object (see IDeleteJobParms interface for details)
     * @returns {Promise<void>} - promise that resolves when the API call is complete
     * @memberof DeleteJobs
     */
    public static async deleteJobCommon(session: AbstractSession, parms: IDeleteJobParms) {
        this.log.trace("deleteJobCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname", "jobid"],
            "You must specify jobname and jobid for the job you want to delete.");
        this.log.info("Deleting job %s (%s). Job modify version?: %s", parms.jobname, parms.jobid, parms.modifyVersion + "");
        const headers: any = [];

        // check the desired version of the job modify header - influences whether the API is synchronous or asynchronous
        if (!parms.modifyVersion) {
            headers.push(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_1);
        } else {
            headers.push(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_2);
        }

        const parameters: string = IO.FILE_DELIM + parms.jobname + IO.FILE_DELIM + parms.jobid;
        await ZosmfRestClient.deleteExpectString(session, JobsConstants.RESOURCE + parameters, headers);
    }


    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
