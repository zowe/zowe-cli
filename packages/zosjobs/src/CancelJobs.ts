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

import { AbstractSession, ImperativeExpect, IO, Logger, Headers } from "@zowe/imperative";
import { JobsConstants } from "./JobsConstants";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IJob } from "./doc/response/IJob";
import { ICancelJobParms } from "./doc/input/ICancelJobParms";
import { ICancelJob } from "./doc/input/ICancelJob";

/**
 * Class to handle deletion of job information
 * @export
 * @class CancelJobs
 */
export class CancelJobs {

    /**
     * Cancel and purge a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - job name to be translated into parms object
     * @param {string} jobid - job id to be translated into parms object
     * @returns {Promise<void>} - promise that resolves when the API call is complete
     * @memberof CancelJobs
     */
    public static async cancelJob(session: AbstractSession, jobname: string, jobid: string, version?: string) {
        this.log.trace("cancelJob called with jobname %s jobid %s", jobname, jobid);
        return CancelJobs.cancelJobCommon(session, { jobname, jobid });
    }

    /**
     * Cancel and purge a job
     * Alternative version of the cancel API accepting an IJob object returned from other APIs such as GetJobs and SubmitJobs
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job that you want to cancel
     * @param {string} version - version of cancel request
     * @returns {Promise<void>} -  promise that resolves when the API call is complete
     * @memberof CancelJobs
     */
    public static async cancelJobForJob(session: AbstractSession, job: IJob, version?: string) {
        this.log.trace("cancelJobForJob called with job %s", JSON.stringify(job));
        return CancelJobs.cancelJobCommon(session, { jobname: job.jobname, jobid: job.jobid, version });
    }

    /**
     * Cancel and purge a job
     * Full version of the API with a parameter object
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ICancelJobParms} parms - parm object (see ICancelJobParms interface for details)
     * @returns {Promise<void>} - promise that resolves when the API call is complete
     * @memberof CancelJobs
     */
    public static async cancelJobCommon(session: AbstractSession, parms: ICancelJobParms) {
        this.log.trace("cancelJobCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname", "jobid"],
            "You must specify jobname and jobid for the job you want to cancel.");

        // set default if unset
        if (parms.version == null) {
            parms.version = JobsConstants.DEFAULT_CANCEL_VERSION;
        }
        this.log.info("Canceling job %s(%s). Job modify version?: %s", parms.jobname, parms.jobid, parms.version);
        const headers: any = [Headers.APPLICATION_JSON];

        // build request
        const request: ICancelJob = {
            request: JobsConstants.REQUEST_CANCEL,
            version: parms.version
        };

        const parameters: string = "/" + parms.jobname + "/" + parms.jobid;
        await ZosmfRestClient.putExpectString(session, JobsConstants.RESOURCE + parameters, headers, request);
    }


    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
