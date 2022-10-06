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

import { AbstractSession, ImperativeExpect, Logger, Headers } from "@zowe/imperative";
import { JobsConstants } from "./JobsConstants";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IJob } from "./doc/response/IJob";
import { IChangeJobParms } from "./doc/input/IChangeJobParms";
import { IChangeJob } from "./doc/input/IChangeJob";
import { IJobFeedback } from "./doc/response/IJobFeedback";

/**
 * Class to handle change of job class information
 * @export
 * @class ChangeJobs
 */
export class ChangeJobs {

    /**
     * Change a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
    //  * @param {string} jobname - job name to be translated into parms object
     * @param {string} jobid - job id to be translated into parms object
     * @param {string} jobclass - job class to be translated into parms object
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ChangeJobs
     */
    public static async changeJob(session: AbstractSession, jobname: string, jobid: string, jobclass: string): Promise<undefined|IJobFeedback> {
        this.log.trace("changeJob called with jobname %s jobid %s", jobname, jobid);
        return ChangeJobs.changeJobCommon(session, { jobname, jobid, jobclass });
    }

    /**
     * Change a job
     * Alternative version of the change API accepting an IJob object returned from other APIs such as GetJobs and SubmitJobs
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job that you want to change
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ChangeJobs
     */
    public static async changeJobForJob(session: AbstractSession, job: IJob ): Promise<undefined|IJobFeedback> {
        this.log.trace("changeJobForJob called with job %s", JSON.stringify(job));
        return ChangeJobs.changeJobCommon(session, { jobname:job.jobname, jobid: job.jobid, jobclass: job.class });
    }

    /**
     * Change a job
     * Full version of the API with a parameter object
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IChangeJobParms} parms - parm object (see IChangeJobParms interface for details)
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ChangeJobs
     */
    public static async changeJobCommon(session: AbstractSession, parms: IChangeJobParms): Promise<undefined|IJobFeedback> {
        this.log.trace("changeJobCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobid"],
            "You must specify jobname and jobid for the job you want to change.");

        this.log.info("Changing job %s.%s", parms.jobname, parms.jobid);
        const headers: any = [Headers.APPLICATION_JSON];

        // build request
        const request: IChangeJob = {
            class: parms.jobclass
        };

        const parameters: string = "/" + parms.jobname + "/" + parms.jobid;
        const responseJson = await ZosmfRestClient.putExpectJSON(session, JobsConstants.RESOURCE + parameters, headers, request);
        const responseFeedback = responseJson as IJobFeedback;
        
        return responseFeedback;

    }


    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
