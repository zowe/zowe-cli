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

import { AbstractSession, Headers, ImperativeError, ImperativeExpect, Logger, NextVerFeatures, RestClient } from "@zowe/core-for-zowe-sdk";
import { JobsConstants } from "./JobsConstants";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ICommonJobParms, IGetJobsParms, IJob, IJobFile } from "./";

/**
 * Class to handle obtaining of z/OS batch job information
 * @export
 * @class GetJobs
 */
export class GetJobs {

    /**
     * Get jobs (defaults to the user ID of the session as owner)
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static getJobs(session: AbstractSession) {
        Logger.getAppLogger().trace("GetJobs.getJobs()");
        return GetJobs.getJobsCommon(session);
    }

    /**
     * Get jobs that match a job name preixl
     * Defaults to jobs owned by the user ID in the session.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} prefix - job name prefix for which to list jobs. Supports wildcard e.g. JOBNM*
     *                          returns jobs with names starting with "JOBNM"
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static async getJobsByPrefix(session: AbstractSession, prefix: string) {
        Logger.getAppLogger().trace("GetJobs.getJobsByPrefix()");
        ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix");
        return GetJobs.getJobsCommon(session, { prefix });
    }

    /**
     * Get jobs that are owned by a certain user or pattern of users
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} owner - owner for which to get jobs. Supports wildcard e.g. IBMU* returns jobs owned by
     *                         all users whose ID beings with "IBMU"
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static async getJobsByOwner(session: AbstractSession, owner: string) {
        Logger.getAppLogger().trace("GetJobs.getJobsByOwner()");
        ImperativeExpect.toBeDefinedAndNonBlank(owner, "owner");
        return GetJobs.getJobsCommon(session, { owner });
    }

    /**
     * Get a list of jobs that match an owner and prefix
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} owner - owner for which to get jobs. Supports wildcard e.g. IBMU* returns jobs owned by
     *                         all users whose ID beings with "IBMU"
     * @param {string} prefix - prefix for which to get jobs. Supports wildcard e.g. JOBNM*
     *                          returns jobs with names starting with "JOBNM"
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static async getJobsByOwnerAndPrefix(session: AbstractSession, owner: string, prefix: string) {
        Logger.getAppLogger().trace("GetJobs.getJobsByOwnerAndPrefix()");
        ImperativeExpect.toBeDefinedAndNonBlank(owner, "owner");
        ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix");
        return GetJobs.getJobsCommon(session, { owner, prefix });
    }

    /**
     * Get a list of jobs that match various parameters
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static async getJobsByParameters(session: AbstractSession, params: IGetJobsParms) {
        Logger.getAppLogger().trace("GetJobs.getJobsByParameters()");
        return GetJobs.getJobsCommon(session, { ...params});
    }

    /**
     * Get a single job object from an input job id
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobid - the job ID for the job for which you want to get status
     * @returns {Promise<IJob>} - promise that resolves to an IJob object from an input jobid
     * @memberof GetJobs
     */
    public static async getJob(session: AbstractSession, jobid: string): Promise<IJob> {
        Logger.getAppLogger().trace("GetJobs.getJob()");
        ImperativeExpect.toBeDefinedAndNonBlank(jobid, "jobid");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        const jobs = await GetJobs.getJobsCommon(session, { jobid, owner: "*" });

        // TODO:V3_ERR_FORMAT - Remove in V3
        const errorMessagePrefix: string = "Obtaining job info for a single job id " + jobid + " on " +
            session.ISession.hostname + ":" + session.ISession.port + " failed: ";

        const userMsg: string = "Cannot obtain job info for job id = " + jobid;
        const diagInfo: string =
            "Protocol:          "   + session.ISession.protocol +
            "\nHost:              " + session.ISession.hostname +
            "\nPort:              " + session.ISession.port +
            "\nBase Path:         " + session.ISession.basePath +
            "\nAuth type:         " + session.ISession.type +
            "\nAllow Unauth Cert: " + !session.ISession.rejectUnauthorized;

        // fail if no jobs
        if (jobs.length === 0) {
            // TODO:V3_ERR_FORMAT - Don't test for env variable in V3
            if (NextVerFeatures.useV3ErrFormat()) {
                throw new ImperativeError({
                    msg: userMsg,
                    causeErrors: "Zero jobs were returned.",
                    additionalDetails: diagInfo
                });
            } else { // TODO:V3_ERR_FORMAT - Remove in V3
                throw new ImperativeError({
                    msg: errorMessagePrefix + "Job not found"
                });
            }
        }

        // fail if unexpected number of jobs (job id should be unique)
        if (jobs.length > 1) {
            // TODO:V3_ERR_FORMAT - Don't test for env variable in V3
            if (NextVerFeatures.useV3ErrFormat()) {
                throw new ImperativeError({
                    msg: userMsg,
                    causeErrors: jobs.length + " jobs were returned. Only expected 1.",
                    additionalDetails: diagInfo
                });
            } else { // TODO:V3_ERR_FORMAT - Remove in V3
                throw new ImperativeError({
                    msg: errorMessagePrefix + "Expected 1 job returned but received " + jobs.length
                });
            }
        }

        // return the single job
        return jobs[0];
    }

    /**
     * Get jobs filtered by owner and prefix.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IGetJobsParms} params - parm object (see IGetJobsParms interface for details)
     * @returns {Promise<IJob[]>} - promise that resolves to an array of IJob objects (matching jobs)
     * @memberof GetJobs
     */
    public static async getJobsCommon(session: AbstractSession, params?: IGetJobsParms) {
        // TODO(Kelosky): after **REMOVED** is fixed we can remove this message
        Logger.getAppLogger().trace("GetJobs.getJobsCommon()");
        ImperativeExpect.toNotBeNullOrUndefined(session, "Required session must be defined");
        let query = JobsConstants.QUERY_ID;

        if (params) {
            if (params.owner) {
                query += (JobsConstants.QUERY_OWNER + encodeURIComponent(params.owner));
            }
            if (params.prefix) {
                if (params.prefix !== JobsConstants.DEFAULT_PREFIX) {
                    if (RestClient.hasQueryString(query)) {
                        query += JobsConstants.COMBO_ID;
                    }
                    query += JobsConstants.QUERY_PREFIX + encodeURIComponent(params.prefix);
                }
            }
            if (params.maxJobs) {
                if (params.maxJobs !== JobsConstants.DEFAULT_MAX_JOBS) {
                    if (RestClient.hasQueryString(query)) {
                        query += JobsConstants.COMBO_ID;
                    }
                    query += (JobsConstants.QUERY_MAX_JOBS + encodeURIComponent(params.maxJobs));
                }
            }
            if (params.jobid) {
                if (RestClient.hasQueryString(query)) {
                    query += JobsConstants.COMBO_ID;
                }
                query += (JobsConstants.QUERY_JOBID + encodeURIComponent(params.jobid));
            }
            if (params.execData) {
                if (RestClient.hasQueryString(query)) {
                    query += JobsConstants.COMBO_ID;
                }
                query += (JobsConstants.EXEC_DATA);
            }
            if (params.status) {
                if (RestClient.hasQueryString(query)) {
                    query += JobsConstants.COMBO_ID;
                }
                query += (JobsConstants.QUERY_STATUS + encodeURIComponent(params.status));
            }
        }

        let resource = JobsConstants.RESOURCE;
        resource += (query === JobsConstants.QUERY_ID) ? "" : query;
        Logger.getAppLogger().info("GetJobs.getJobsCommon() resource: " + resource);

        const jobs = await ZosmfRestClient.getExpectJSON<IJob[]>(session, resource);

        return GetJobs.filterResultsByStatuses(jobs, params);
    }

    /**
     * Get the status and other details (e.g. owner, return code) for a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - the job name for the job for which you want to get status
     * @param {string} jobid - the job ID for the job for which you want to get status
     * @returns {Promise<IJob>} - promise that resolves to an IJob object representing the job
     * @memberof GetJobs
     */
    public static async getStatus(session: AbstractSession, jobname: string, jobid: string) {
        Logger.getAppLogger().trace("GetJobs.getStatus()");
        return GetJobs.getStatusCommon(session, { jobname, jobid });
    }

    /**
     * Get the status and other details (e.g. owner, return code) for a job
     * Alternate version of the API that accepts an IJob object returned by
     * other APIs such as SubmitJobs.  Even though the parameter and return
     * value are of the same type, the IJob object returned will have the
     * current status of the job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - job object
     * @returns {Promise<IJob>} - promise that resolves to an IJob object representing the job
     * @memberof GetJobs
     */
    public static async getStatusForJob(session: AbstractSession, job: IJob) {
        Logger.getAppLogger().trace("GetJobs.getStatusForJob()");
        return GetJobs.getStatusCommon(session, { jobname: job.jobname, jobid: job.jobid });
    }

    /**
     * Get the status and other details (e.g. owner, return code) for a job
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ICommonJobParms} parms - parm object (see ICommonJobParms interface for details)
     * @returns {Promise<IJob>} - promise that resolves to an IJob object representing the job
     * @memberof GetJobs
     */
    public static async getStatusCommon(session: AbstractSession, parms: ICommonJobParms) {
        Logger.getAppLogger().trace("GetJobs.getStatusCommon()");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname", "jobid"]);
        const parameters: string = "/" + encodeURIComponent(parms.jobname) + "/" + encodeURIComponent(parms.jobid);
        // + Jobs.QUERY_ID + Jobs.STEP_DATA;
        Logger.getAppLogger().info("GetJobs.getStatusCommon() parameters: " + parameters);
        return ZosmfRestClient.getExpectJSON<IJob>(session, JobsConstants.RESOURCE + parameters);
    }

    /**
     * Get a list of all spool files for a job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - the job name for the job for which you want to get a list of spool files
     * @param {string} jobid - the job ID for the job for which you want to get a list of spool files
     * @returns {Promise<IJobFile[]>} - promise that resolves to an array of IJobFile objects
     * @memberof GetJobs
     */
    public static getSpoolFiles(session: AbstractSession, jobname: string, jobid: string) {
        Logger.getAppLogger().trace("GetJobs.getSpoolFiles()");
        return GetJobs.getSpoolFilesCommon(session, { jobname, jobid });
    }

    /**
     * Get a list of all job spool files for a job
     * Alternate version of the API that accepts an IJob object returned by
     * other APIs such as SubmitJobs.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job for which you would like to get a list of job spool files
     * @returns {Promise<IJobFile[]>} - promise that resolves to an array of IJobFile objects
     * @memberof GetJobs
     */
    public static getSpoolFilesForJob(session: AbstractSession, job: IJob) {
        Logger.getAppLogger().trace("GetJobs.getSpoolFilesForJob()");
        return GetJobs.getSpoolFilesCommon(session, { jobname: job.jobname, jobid: job.jobid });
    }

    /**
     * Get a list of all job spool files for a job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ICommonJobParms} parms - parm object (see for details)
     * @returns {Promise<IJobFile[]>} - promise that resolves to an array of IJobFile objectsl
     * @memberof GetJobs
     */
    public static async getSpoolFilesCommon(session: AbstractSession, parms: ICommonJobParms) {
        Logger.getAppLogger().trace("GetJobs.getSpoolFilesCommon()");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname", "jobid"]);
        const parameters: string = "/" + encodeURIComponent(parms.jobname) + "/" + encodeURIComponent(parms.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES;
        Logger.getAppLogger().info("GetJobs.getSpoolFilesCommon() parameters: " + parameters);
        return ZosmfRestClient.getExpectJSON<IJobFile[]>(session, JobsConstants.RESOURCE + parameters);
    }

    /**
     * Get JCL from a job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobname - the job name for the job for which you want to retrieve JCL
     * @param {string} jobid - the job ID for the job for which you want to retrieve JCL
     * @returns {Promise<IJob>} - job document on resolve
     * @memberof GetJobs
     */
    public static async getJcl(session: AbstractSession, jobname: string, jobid: string) {
        Logger.getAppLogger().trace("GetJobs.getJcl()");
        return GetJobs.getJclCommon(session, { jobname, jobid });
    }

    /**
     * Get JCL from a job.
     * Alternate version of the API that accepts an IJob object returned by
     * other APIs such as SubmitJobs.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - the job for which you would like to retrieve JCL
     * @returns {Promise<string>} - promise that resolves to JCL content
     * @memberof GetJobs
     */
    public static async getJclForJob(session: AbstractSession, job: IJob) {
        Logger.getAppLogger().trace("GetJobs.getJclForJob()");
        return GetJobs.getJclCommon(session, { jobname: job.jobname, jobid: job.jobid });
    }

    /**
     * Get the JCL that was used to submit a job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ICommonJobParms} parms - parm object (see ICommonJobParms interface for details)
     * @returns {Promise<string>} - promise that resolves to the JCL content
     * @memberof GetJobs
     */
    public static async getJclCommon(session: AbstractSession, parms: ICommonJobParms) {
        Logger.getAppLogger().trace("GetJobs.getJclCommon()");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["jobname", "jobid"]);
        const parameters: string = "/" + encodeURIComponent(parms.jobname) + "/" + encodeURIComponent(parms.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + JobsConstants.RESOURCE_JCL_CONTENT + JobsConstants.RESOURCE_SPOOL_CONTENT;
        Logger.getAppLogger().info("GetJobs.getJclCommon() parameters: " + parameters);
        return ZosmfRestClient.getExpectString(session, JobsConstants.RESOURCE + parameters);
    }

    /**
     * Get spool content from a job (keeping naming convention patter with this duplication function).
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param jobFile - the spool file for which you want to retrieve the content
     * @returns {Promise<string>} - promise that resolves to the spool content
     * @memberof GetJobs
     */
    public static getSpoolContent(session: AbstractSession, jobFile: IJobFile) {
        Logger.getAppLogger().trace("GetJobs.getSpoolContent()");
        return GetJobs.getSpoolContentCommon(session, jobFile);
    }

    /**
     * Get spool content from a job using the job name, job ID, and spool ID number from z/OSMF
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param jobname - the job name for the job containing the spool content
     * @param jobid - the job id for the job containing the spool content
     * @param spoolId - id number assigned by zosmf that identifies the particular job spool file (DD)
     * @returns {Promise<string>} - promise that resolves to the spool content
     * @memberof GetJobs
     */
    public static async getSpoolContentById(session: AbstractSession, jobname: string, jobid: string, spoolId: number) {
        Logger.getAppLogger().trace("GetJobs.getSpoolContentById()");
        ImperativeExpect.toNotBeNullOrUndefined(jobname, "Required parameter jobname must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(jobid, "Required parameter jobid must be defined");
        ImperativeExpect.toNotBeNullOrUndefined(spoolId, "Required parameter spoolId must be defined");
        const parameters: string = "/" + encodeURIComponent(jobname) + "/" + encodeURIComponent(jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + encodeURIComponent(spoolId) + JobsConstants.RESOURCE_SPOOL_CONTENT;
        Logger.getAppLogger().info("GetJobs.getSpoolContentById() parameters: " + parameters);
        return ZosmfRestClient.getExpectString(session, JobsConstants.RESOURCE + parameters, [Headers.TEXT_PLAIN_UTF8]);
    }

    /**
     * Get spool content from a job.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param jobFile - the spool file for which you want to retrieve the content
     * @returns {Promise<string>} - promise that resolves to the spool content
     * @memberof GetJobs
     */
    public static async getSpoolContentCommon(session: AbstractSession, jobFile: IJobFile) {
        Logger.getAppLogger().trace("GetJobs.getSpoolContentCommon()");
        ImperativeExpect.toNotBeNullOrUndefined(jobFile, "Required job file object must be defined");
        const parameters: string = "/" + encodeURIComponent(jobFile.jobname) + "/" + encodeURIComponent(jobFile.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + encodeURIComponent(jobFile.id) + JobsConstants.RESOURCE_SPOOL_CONTENT;
        Logger.getAppLogger().info("GetJobs.getSpoolContentCommon() parameters: " + parameters);
        return ZosmfRestClient.getExpectString(session, JobsConstants.RESOURCE + parameters, [Headers.TEXT_PLAIN_UTF8]);
    }

    private static filterResultsByStatuses(jobs: IJob[], params: IGetJobsParms | undefined): IJob[] {
        if (params?.status && params.status.toLowerCase() != "active" && params.status != "*") {
            const newJobs = jobs.filter(job => job.status.toLowerCase() === params.status.toLowerCase());
            return newJobs;
        }
        return jobs;
    }
}
