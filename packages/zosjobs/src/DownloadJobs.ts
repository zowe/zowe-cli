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

import * as path from "path";
import { AbstractSession, ImperativeExpect, IO, Logger, Headers} from "@zowe/imperative";
import { JobsConstants } from "./JobsConstants";
import { IDownloadAllSpoolContentParms } from "./doc/input/IDownloadAllSpoolContentParms";
import { IJobFile } from "./doc/response/IJobFile";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IDownloadSpoolContentParms } from "./doc/input/IDownloadSpoolContentParms";
import { GetJobs } from "./GetJobs";
import { MonitorJobs } from "./MonitorJobs";
import { IJob } from "./doc/response/IJob";


/**
 * Class to handle downloading of job information
 * @export
 * @class DownloadJobs
 */
export class DownloadJobs {

    /**
     * Default directory where output will be placed
     * @static
     * @type {string}
     * @memberof DownloadJobs
     */
    public static readonly DEFAULT_JOBS_OUTPUT_DIR: string = "./output";

    /**
     * Default extension of downloaded folders
     * @static
     * @type {string}
     * @memberof DownloadJobs
     */
    public static readonly DEFAULT_JOBS_OUTPUT_FILE_EXT: string = ".txt";

    /**
     * Download spool content to a the default download directory
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param jobFile - spool file to download
     * @returns {Promise<string>} - content downloaded
     * @memberof DownloadJobs
     */
    public static async downloadSpoolContent(session: AbstractSession, jobFile: IJobFile) {
        this.log.trace("Entered downloadSpoolContent for job file %s", JSON.stringify(jobFile));
        return DownloadJobs.downloadSpoolContentCommon(session, {jobFile});
    }

    /**
     * Download all job output (spool content) for a job to a the local directory
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IDownloadAllSpoolContentParms} parms - parameter object (see IDownloadAllSpoolContentParms for details)
     * @returns {Promise<void>} - a promise which will resolve when the download is complete
     * @memberof DownloadJobs
     */
    public static async downloadAllSpoolContentCommon(session: AbstractSession, parms: IDownloadAllSpoolContentParms) {
        this.log.trace("Entering downloadAllSpoolContentCommon with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jobid", "jobname"], "You must specify job ID and job name on your" +
            " 'parms' object to the downloadAllSpoolContent API.");
        this.log.debug("Downloading all spool content for job %s(%s)", parms.jobname, parms.jobid);

        const jobFiles = await GetJobs.getSpoolFiles(session, parms.jobname, parms.jobid);
        // Maintain a mapping of step names and associated DD names to detect duplicate step names
        const usedStepNames: {[key: string]: string[]} = {};
        for (const file of jobFiles) {
            let uniqueDDName = file.ddname;
            if (usedStepNames[file.stepname] != null) {
                let index = 1;
                while (usedStepNames[file.stepname].indexOf(uniqueDDName) !== -1) {
                    uniqueDDName = `${file.ddname}(${index})`;
                    index++;
                }
            }
            await DownloadJobs.downloadSpoolContentCommon(session, {
                ...parms,
                jobFile: {...file, ddname: uniqueDDName},
            });
            usedStepNames[file.stepname] = [...usedStepNames[file.stepname] || [], uniqueDDName];
        }
    }


    /**
     * Download spool content to specified directory
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IDownloadSpoolContentParms} parms - parm object (see IDownloadSpoolContentParms interface for details)
     * @returns {Promise<void>} - promise that resolves when the file is downloaded
     * @memberof DownloadJobs
     */
    public static async downloadSpoolContentCommon(session: AbstractSession, parms: IDownloadSpoolContentParms): Promise<void> {
        this.log.trace("Entering downloadSpoolContentCommon with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jobFile"], "You must specify a job file on your 'parms' parameter" +
            " object to the downloadSpoolContentCommon API.");

        //waiting for job to be active before continuing with job download
        if (parms.waitForActive) {
            await MonitorJobs.waitForActiveStatus(session, parms.jobname, parms.jobid);
        }

        //waiting for job status to be output before continuing on with job download
        if (parms.waitForOutput) {
            await MonitorJobs.waitForJobOutputStatus(session, {
                jobname: parms.jobname,
                jobid: parms.jobid
            } as IJob);
        }

        const job = parms.jobFile;
        let debugMessage = `Downloading spool file ${job.ddname} for job ${job.jobname}(${job.jobid})`;
        let file: string;
        if (parms.stream == null) {
            file = DownloadJobs.getSpoolDownloadFilePath(parms);
            IO.createDirsSyncFromFilePath(file);
            IO.createFileSync(file);
            debugMessage += ` to ${file}`;
        }

        this.log.debug(debugMessage);

        let parameters: string = "/" + encodeURIComponent(job.jobname) + "/" + encodeURIComponent(job.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + encodeURIComponent(job.id) + JobsConstants.RESOURCE_SPOOL_CONTENT;

        if (parms.binary) {
            parameters += "?mode=binary";
        } else if (parms.record) {
            parameters += "?mode=record";
        }

        if (!parms.binary && !parms.record && parms.encoding != null && String(parms.encoding).trim()) {
            parameters += "?fileEncoding=" + parms.encoding;
        }

        const headers = [Headers.TEXT_PLAIN_UTF8];

        // Handle record range
        if (parms.recordRange) {
            const recordRangeMatch = parms.recordRange.match(/^(\d+)-(\d+)$/); // Match multi-digit numbers
            if (recordRangeMatch) {
                const start = parseInt(recordRangeMatch[1], 10);
                const end = parseInt(recordRangeMatch[2], 10);

                if (start >= 0 && end > start) {
                    if (parms.recordRange) {
                        headers.push({ "X-IBM-Record-Range": `${start}-${end}` });
                    }
                } else {
                    throw new Error(`Invalid record range specified: ${parms.recordRange}. Ensure the format is x-y with x < y.`);
                }
            } else {
                throw new Error(`Invalid record range format: ${parms.recordRange}. Expected format is x-y.`);
            }
        }

        const writeStream = parms.stream ?? IO.createWriteStream(file);
        const normalizeResponseNewLines = !(parms.binary || parms.record);
        await ZosmfRestClient.getStreamed(session, JobsConstants.RESOURCE + parameters, headers, writeStream,
            normalizeResponseNewLines);
    }

    /**
     * Get the file where a specified spool file (IJobFile) would be downloaded to
     * @static
     * @param {IDownloadSpoolContentParms} parms - parm object (see IDownloadSpoolContentParms interface for details)
     * @returns {string} the file path that the spool file would be downloaded to
     * @memberof DownloadJobs
     */
    public static getSpoolDownloadFilePath(parms: IDownloadSpoolContentParms): string {
        this.log.trace("getSpoolDownloadFilePath called with jobFile %s, omitJobIDDirectory: %s, outDir: %s",
            JSON.stringify(parms.jobFile), parms.omitJobidDirectory + "", parms.outDir);

        let directory: string = parms.outDir ?? DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR;

        if (parms.omitJobidDirectory == null || parms.omitJobidDirectory === false) {
            directory += path.posix.sep + parms.jobFile.jobid;
        }

        if (parms.jobFile.procstep != null) {
            directory += path.posix.sep + parms.jobFile.procstep;
        }

        if (parms.jobFile.stepname != null) {
            directory += path.posix.sep + parms.jobFile.stepname;
        }

        const extension = parms.extension ?? DownloadJobs.DEFAULT_JOBS_OUTPUT_FILE_EXT;

        return directory + path.posix.sep + parms.jobFile.ddname + extension;
    }

    /**
     * Getter for Zowe logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
