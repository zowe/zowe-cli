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

import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { AbstractSession, Headers, IHeaderContent, ImperativeError, ImperativeExpect, IO, Logger, TaskProgress } from "@zowe/imperative";
import {
    IJob,
    ISubmitJclNotifyParm,
    ISubmitJclParms,
    ISubmitJobNotifyParm,
    ISubmitJobParms,
    JOB_STATUS
} from "./";
import { JobsConstants } from "./JobsConstants";
import { ZosJobsMessages } from "./JobsMessages";
import { ISubmitParms } from "./doc/input/ISubmitParms";
import { GetJobs } from "./GetJobs";
import { IJobFile } from "./doc/response/IJobFile";
import { IDownloadAllSpoolContentParms } from "./doc/input/IDownloadAllSpoolContentParms";
import { DownloadJobs } from "./DownloadJobs";
import { MonitorJobs } from "./MonitorJobs";
import { ISpoolFile } from "./doc/response/ISpoolFile";

/**
 * Class to handle submitting of z/OS batch jobs via z/OSMF
 * @export
 * @class SubmitJobs
 */
export class SubmitJobs {

    // used to delimit a value in a JCL symbol definition
    private static readonly singleQuote = "'";

    /**
     * Submit a job that resides in a z/OS data set.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobDataSet - job data set to be translated into parms object
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static submitJob(session: AbstractSession, jobDataSet: string) {
        this.log.trace("submitJob called with data set %s", jobDataSet);
        return SubmitJobs.submitJobCommon(session, {jobDataSet});
    }

    /**
     * Submit a job that resides in a z/OS data set.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ISubmitJobParms} parms - parm object (see for details)
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJobCommon(session: AbstractSession, parms: ISubmitJobParms) {
        this.log.trace("submitJobCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jobDataSet"], "You must provide a data set containing JCL to submit in parms.jobDataSet");
        this.log.debug("Submitting a job located in the data set '%s'", parms.jobDataSet);
        const fullyQualifiedDataset: string = "//'" + parms.jobDataSet + "'";
        const jobObj: object = {file: fullyQualifiedDataset};
        let extraHeaders: IHeaderContent[] = [];
        if (parms.jclSymbols) {extraHeaders = this.getSubstitutionHeaders(parms.jclSymbols);}
        return ZosmfRestClient.putExpectJSON<IJob>(session, JobsConstants.RESOURCE,
            [Headers.APPLICATION_JSON, ...extraHeaders], jobObj);
    }

    /**
     * Submit a string of JCL to run
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jcl - string of JCL that you want to be submit
     * @param {string} internalReaderRecfm - record format of the jcl you want to submit. "F" (fixed) or "V" (variable)
     * @param {string} internalReaderLrecl - logical record length of the jcl you want to submit
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static submitJcl(session: AbstractSession, jcl: string, internalReaderRecfm?: string, internalReaderLrecl?: string) {
        this.log.trace("submitJcl called with jcl of length %d. internalReaderRecfm %s internalReaderLrecl %s",
            jcl == null ? "no jcl!" : jcl.length, internalReaderRecfm, internalReaderLrecl);
        return SubmitJobs.submitJclCommon(session, {jcl, internalReaderRecfm, internalReaderLrecl});
    }

    public static async submitJclString(session: AbstractSession, jcl: string, parms: ISubmitParms): Promise<IJob | ISpoolFile[]> {
        ImperativeExpect.toNotBeNullOrUndefined(jcl, ZosJobsMessages.missingJcl.message);
        ImperativeExpect.toNotBeEqual(jcl, "", ZosJobsMessages.missingJcl.message);
        const responseJobInfo: IJob = await SubmitJobs.submitJclCommon(session, {jcl, jclSymbols: parms.jclSymbols});
        const response: Promise<IJob | ISpoolFile[]> = this.checkSubmitOptions(session, parms, responseJobInfo);
        return response;
    }

    /**
     * Submit a JCL string to run
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ISubmitJclParms} parms - parm object (see for details)
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJclCommon(session: AbstractSession, parms: ISubmitJclParms) {
        this.log.trace("submitJclCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jcl"],
            "You must provide a JCL string to submit. The 'jcl' field of the provided parameters was undefined. ");
        this.log.debug("Submitting JCL of length %d", parms.jcl.length);
        const headers: any[] = [Headers.TEXT_PLAIN_UTF8, ZosmfHeaders.X_IBM_INTRDR_MODE_TEXT];
        if (parms.internalReaderLrecl) {
            this.log.debug("Custom internal reader logical record length (internalReaderLrecl) '%s' specified ", parms.internalReaderLrecl);
            headers.push({"X-IBM-Intrdr-Lrecl": parms.internalReaderLrecl});
        } else {
            // default to 80 record length
            headers.push(ZosmfHeaders.X_IBM_INTRDR_LRECL_80);
        }
        if (parms.internalReaderRecfm) {
            this.log.debug("Custom internal reader record format (internalReaderRecfm) '%s' specified ", parms.internalReaderRecfm);
            headers.push({"X-IBM-Intrdr-Recfm": parms.internalReaderRecfm});
        } else {
            // default to fixed format records
            headers.push(ZosmfHeaders.X_IBM_INTRDR_RECFM_F);
        }
        if (parms.jclSymbols) {
            const extraHeaders = this.getSubstitutionHeaders(parms.jclSymbols);
            headers.push(...extraHeaders);
        }
        return ZosmfRestClient.putExpectJSON<IJob>(session, JobsConstants.RESOURCE, headers, parms.jcl);
    }

    /**
     * Submit a JCL string  to run
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jcl - string of JCL that you want to be submit
     * @param {string} internalReaderRecfm - record format of the jcl you want to submit. "F" (fixed) or "V" (variable).
     * @param {string} internalReaderLrecl - logical record length of the jcl you want to submit
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJclNotify(session: AbstractSession, jcl: string, internalReaderRecfm?: string, internalReaderLrecl?: string) {
        this.log.trace("submitJclNotiy called with jcl of length %s, internalReaderRecfm %s, internalReaderLrecl %s",
            jcl == null ? "no jcl!" : jcl.length, internalReaderRecfm, internalReaderLrecl);
        return SubmitJobs.submitJclNotifyCommon(session, {jcl, internalReaderRecfm, internalReaderLrecl});
    }

    /**
     * Submit a job from a string of JCL and be notified whenever it reaches the default status on a default polling interval.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ISubmitJclNotifyParm} parms - parm object (see for details)
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJclNotifyCommon(session: AbstractSession, parms: ISubmitJclNotifyParm) {
        this.log.trace("submitJclNotifyCommon called with parms %s", JSON.stringify(parms));
        const job = await SubmitJobs.submitJclCommon(session, parms);
        return SubmitJobs.submitNotifyCommon(session, job, parms.status, parms.watchDelay);
    }

    /**
     * Submit a job and be notified whenever it reaches the default status on a default polling interval.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} jobDataSet - job data set to be translated into parms object with assumed defaults
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJobNotify(session: AbstractSession, jobDataSet: string): Promise<IJob> {
        this.log.trace("submitJobNotify called with data set %s", jobDataSet);
        return SubmitJobs.submitJobNotifyCommon(session, {jobDataSet});
    }

    /**
     * Submit a job from a data set and be notified whenever it reaches a certain status.
     * If not status is specified, MonitorJobs.DEFAULT_STATUS is assumed.
     * The polling interval can also be optionally controlled via parms.watchDelay.
     * If not specified, the default polling is MonitorJobs.DEFAULT_WATCH_DELAY.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ISubmitJobNotifyParm} parms - parm object (see for details)
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    public static async submitJobNotifyCommon(session: AbstractSession, parms: ISubmitJobNotifyParm) {
        this.log.trace("submitJobNotifyCommon called with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jobDataSet"], "You must provide a data set containing JCL to submit in parms.jobDataSet.");
        const job = await SubmitJobs.submitJobCommon(session, parms);
        return SubmitJobs.submitNotifyCommon(session, job, parms.status, parms.watchDelay);
    }

    /**
     * Common method to handle job submit options
     * @public
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {ISubmitParms } parms - Submit options
     * @param {IJob} responseJobInfo - job document for a previously submitted job
     * @returns {Promise<IJob | ISpoolFile[]>} - Promise that resolves to an IJob or ISpoolFile[]
     * @memberof SubmitJobs
     */
    public static async checkSubmitOptions(session: AbstractSession, parms: ISubmitParms, responseJobInfo: IJob): Promise<IJob | ISpoolFile[]> {

        if (parms.waitForActive) {
            const activeJob = await MonitorJobs.waitForStatusCommon(session, {
                jobid: responseJobInfo.jobid,
                jobname: responseJobInfo.jobname,
                status: "ACTIVE"
            });
            return activeJob;
        }
        // if viewAppSpoolContent option passed, it waits till job status is output
        // then get content of each spool file and return array of ISpoolFiles object
        if (parms.viewAllSpoolContent || parms.waitForOutput) {
            if (parms.task != null) {
                parms.task.statusMessage = "Waiting for " + responseJobInfo.jobid + " to enter OUTPUT";
                parms.task.percentComplete = TaskProgress.THIRTY_PERCENT;
            }
            const job: IJob = await MonitorJobs.waitForJobOutputStatus(session, responseJobInfo);
            if (!parms.viewAllSpoolContent) {
                return job;
            }
            if (parms.task != null) {
                parms.task.statusMessage = "Retrieving spool content for " + job.jobid +
                    (job.retcode == null ? "" : ", " + job.retcode);
                parms.task.percentComplete = TaskProgress.SEVENTY_PERCENT;
            }

            const spoolFiles: IJobFile[] = await GetJobs.getSpoolFilesForJob(session, job);
            const arrOfSpoolFile: ISpoolFile[] = [];
            for (const file of spoolFiles) {
                const spoolContent = await GetJobs.getSpoolContent(session, file);
                arrOfSpoolFile.push({
                    id: file.id,
                    ddName: file.ddname,
                    stepName: file.stepname,
                    procName: file.procstep,
                    data: spoolContent
                });
            }
            return arrOfSpoolFile;

            // if directory option passed, it waits till job status is output
            // then downloads content of all spool files and returns IJob object
        } else if (parms.directory) {
            // waits job status to be output
            if (parms.task != null) {
                parms.task.statusMessage = "Waiting for " + responseJobInfo.jobid + " to enter OUTPUT";
                parms.task.percentComplete = TaskProgress.THIRTY_PERCENT;
            }
            const job: IJob = await MonitorJobs.waitForJobOutputStatus(session, responseJobInfo);
            const downloadParms: IDownloadAllSpoolContentParms = {
                jobid: job.jobid,
                jobname: job.jobname,
                outDir: parms.directory
            };
            if (parms.extension) {
                downloadParms.extension = IO.normalizeExtension(parms.extension);
            }
            if (parms.task != null) {
                parms.task.statusMessage = "Downloading spool content for " + job.jobid +
                    (job.retcode == null ? "" : ", " + job.retcode);
                parms.task.percentComplete = TaskProgress.SEVENTY_PERCENT;
            }
            (await DownloadJobs.downloadAllSpoolContentCommon(session, downloadParms));
            return job;
        }
        return responseJobInfo;
    }

    /**
     * Common method to watch for a job to reach a certain status whether the job was
     * submitted through raw JCL statement or through a data set containing JCL.
     * @private
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IJob} job - job document for a previously submitted job
     * @param {JOB_STATUS } status - status that we want this job to reach before notifying
     * @param {number} watchDelay - delay / interval to poll
     * @returns {Promise<IJob>} - Promise that resolves to an IJob document with details about the submitted job
     * @memberof SubmitJobs
     */
    private static async submitNotifyCommon(session: AbstractSession, job: IJob, status: JOB_STATUS,
                                            watchDelay: number) {
        this.log.trace("submitNotiyCommon called with job %s, status %s, watchDelay %s",
            JSON.stringify(job), status, watchDelay);
        ImperativeExpect.keysToBeDefined(job, ["jobname", "jobid"], "The job object you provide must contain both 'jobname' and 'jobid'.");
        this.log.debug("Waiting to be notified of job completion from Monitor Jobs API for job %s (%s)", job.jobname, job.jobid);
        return MonitorJobs.waitForStatusCommon(session,
            {
                jobname: job.jobname,
                jobid: job.jobid,
                status,
                watchDelay
            });
    }

    /**
     * Parse input string for JCL substitution
     * @param {string} symbols - JCL substitution symbols
     * @returns {IHeaderContent[]} headers - Headers to add to the request
     * @memberof SubmitJobs
     */
    private static getSubstitutionHeaders(symbols: string): IHeaderContent[] {
        const headers: IHeaderContent[] = [];
        const blank = " ";
        const equals = "=";
        const maxSymLen = 8;
        let symStartInx = 0;

        moreSymLoop:
        while(symStartInx < symbols.length) {
            // skip all blanks at the start of a sym def
            while (symbols[symStartInx] === blank) {
                if (++symStartInx >= symbols.length) {
                    break moreSymLoop;
                }
            }

            // navigate to the end of the symbol
            let symName: string = null;
            let symEndInx: number;
            for (symEndInx = symStartInx; symEndInx < symbols.length; symEndInx++) {
                if (symbols[symEndInx] === equals) {
                    symName = symbols.substring(symStartInx, symEndInx);
                    break;
                }
            }
            if (symName == null) {
                throw new ImperativeError({
                    msg: `No equals '${equals}' character was specified to define a symbol name.`
                });
            }
            if (symName.length === 0) {
                throw new ImperativeError({
                    msg: `No symbol name specified before the equals '${equals}' character.`
                });
            }
            if (symName.length > maxSymLen) {
                throw new ImperativeError({
                    msg: `The symbol name '${symName}' is too long. It must 1 to ${maxSymLen} characters.`
                });
            }

            let valStartInx = ++symEndInx;
            if (valStartInx >= symbols.length) {
                throw new ImperativeError({msg: `No value specified for symbol name '${symName}'.`});
            }

            // is our value in quotes?
            let valEndChar: string = blank;
            if (symbols[valStartInx] === SubmitJobs.singleQuote ) {
                // do we have an escaped quote (two in a row).
                if (++valStartInx >= symbols.length) {
                    throw new ImperativeError({
                        msg: "The value for symbol '" + symName +
                            "' is missing a terminating quote (" +
                            SubmitJobs.singleQuote + ")."
                    });
                }
                if (symbols[valStartInx] === SubmitJobs.singleQuote ) {
                    // point to the first of the two quotes
                    --valStartInx;
                } else {
                    valEndChar = SubmitJobs.singleQuote;
                }
            }

            // find the end of the value
            let valEndInx: number;
            for (valEndInx = valStartInx; valEndInx < symbols.length; valEndInx++) {
                if (symbols[valEndInx] === valEndChar) {
                    if (valEndChar === SubmitJobs.singleQuote) {
                        // do we have an escaped quote (two in a row).
                        if (valEndInx + 1 < symbols.length &&
                            symbols[valEndInx + 1] === SubmitJobs.singleQuote)
                        {
                            // keep looking for a terminating quote
                            valEndInx++;
                            continue;
                        }
                    }

                    // place the next sym def into our array of headers.
                    const header = SubmitJobs.formSubstitutionHeader(
                        symName, symbols, valStartInx, valEndInx
                    );
                    headers.push(header);
                    break;
                }
            }

            if (valEndInx >= symbols.length) {
                if (valEndChar === SubmitJobs.singleQuote) {
                    throw new ImperativeError({
                        msg: "The value for symbol '" + symName +
                            "' is missing a terminating quote (" +
                            SubmitJobs.singleQuote + ")."
                    });
                } else {
                    /* Since it is unlikely to have a trailing blank at the end of the
                     * last symbol value, just accept all remaining characters in the
                     * argument as the value for the last symbol.
                     */
                    const header = SubmitJobs.formSubstitutionHeader(
                        symName, symbols, valStartInx, symbols.length
                    );
                    headers.push(header);
                }
            }

            // start the search for our next symbol definition
            symStartInx = ++valEndInx;
        }

        let logMsg = "Formed the following JCL symbol headers:\n";
        headers.forEach((nextHeader) => {
            for (const key in nextHeader) {
                if (nextHeader.hasOwnProperty(key)) {
                    logMsg += "    " + key + " = " + nextHeader[key] + "\n";
                }
            }
        });
        this.log.debug(logMsg);
        return headers;
    }

    /**
     * Form a header used for JCL symbol substitution
     *
     * @param {string} symName
     *     The name of the JCL substitution symbol
     *
     * @param {string} symDefs
     *       The CLI argument that contains all of the JCL substitution symbol definitions
     *
     * @param {string} valStartInx
     *       Index into symDefs to the start of the value for symName.
     *
     * @param {string} valEndInx
     *       Index into symDefs that is one past the end of the value for symName.
     *
     * @returns {IHeaderContent}
     *      Header to add to our set of headers
     * @memberof SubmitJobs
     */
    private static formSubstitutionHeader(
        symName: string,
        symDefs: string,
        valStartInx: number,
        valEndInx: number
    ): IHeaderContent {
        // now that we identified the value, reduce occurrences of two quotes to one.
        const twoQuoteRegex = new RegExp(SubmitJobs.singleQuote + SubmitJobs.singleQuote, "g");
        let symVal = symDefs.substring(valStartInx, valEndInx);
        symVal = symVal.replace(twoQuoteRegex, SubmitJobs.singleQuote);

        // construct the required header
        const key = ZosmfHeaders.X_IBM_JCL_SYMBOL_PARTIAL + symName.toUpperCase();
        return {[key]: symVal};
    }

    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
