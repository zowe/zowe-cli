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

import { AbstractSession, ImperativeExpect, Logger, Headers, ImperativeError } from "@zowe/imperative";
import { JobsConstants } from "./JobsConstants";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IJob } from "./doc/response/IJob";
import { IModifyJobParms } from "./doc/input/IModifyJobParms";
import { IModifyJob } from "./doc/input/IModifyJob";
import { IJobFeedback } from "./doc/response/IJobFeedback";


/**
 * Class to handle modify of jobclass and holdStatus information
 * @export
 * @class ModifyJobs
 */
export class ModifyJobs {

    /**
     * Modify a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - job name to be translated into parms object
     * @param {string} jobid - job id to be translated into parms object
     * @param {string} jobclass - job class to be translated into parms object
     * @param {boolean} hold - flag that holds a job from execution
     * @param {boolean} release - flag that releases a held a job for execution
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ModifyJobs
     */
    public static async modifyJob(session: AbstractSession, jobname: string, jobid: string,
        jobclass?: string, hold?: boolean, release?: boolean): Promise<undefined|IJobFeedback> {
        this.log.trace("ModifyJob called with jobname %s jobid %s", jobname, jobid);
        return ModifyJobs.modifyJobCommon(session, { jobname, jobid, jobclass, hold, release});
    }

    /**
     * Modify a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job that you want to modify
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ModifyJobs
     */
    public static async modifyJobForJob(session: AbstractSession, job: IJob ): Promise<undefined|IJobFeedback> {
        this.log.trace("ModifyJobForJob called with job %s", JSON.stringify(job));
        return ModifyJobs.modifyJobCommon(session,
            { jobname:job.jobname, jobid: job.jobid, jobclass: job.class, hold: job.hold, release: job.release });
    }

    /**
     * Modify a job
     * Full version of the API with a parameter object
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IModifyJobParms} parms - parm object (see IModifyJobParms interface for details)
     * @returns {Promise<undefined|IJobFeedback>} - promise of undefined, or IJobFeedback object returned by API if modifyVersion is 2.0
     * @memberof ModifyJobs
     */
    public static async modifyJobCommon(session: AbstractSession, parms: IModifyJobParms): Promise<undefined|IJobFeedback> {
        this.log.trace("ModifyJobCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobid", "jobname"],
            "You must specify both the jobname and jobid for the job you want to modify.");
        this.log.info("Modifying job %s.%s", parms.jobname, parms.jobid);

        const headers: any = [Headers.APPLICATION_JSON];
        const parameters: string = "/" + parms.jobname + "/" + parms.jobid;
        let response: IJobFeedback;
        let request: IModifyJob;
        let mergedMessage: string = "";
        let exception: boolean = false;

        if(parms.hold && parms.release){
            throw new ImperativeError({msg: "Parameters `hold` and `release` are in conflict and cannot be specified together"});
        }    

        if(parms.hold || parms.release){
            parms.hold ? request = { request: "hold"} : request = { request: "release"};
            try{
                response = await ZosmfRestClient.putExpectJSON(session, JobsConstants.RESOURCE + parameters, headers, request);
            }
            catch(err){
                exception = true;
                err.mMessage=err.mMessage.concat('Modification Error');
                return err;
            }
            response.message = mergedMessage = '\n' + response.message;
        }

        // build request to change class, only if defined and no exception from potential previous request
        if (parms.jobclass != undefined && !exception){
            request = {
                class: parms.jobclass,
            };
            response = await ZosmfRestClient.putExpectJSON(session, JobsConstants.RESOURCE + parameters, headers, request);
            response.message = mergedMessage + '\n' + response.message;
        }
        return response;
    }


    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
