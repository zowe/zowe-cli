/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, ImperativeExpect, IO, Logger } from "@brightside/imperative";
import { JobsConstants } from "./JobsConstants";
import { IDownloadSpoolContentParms, IJobFile } from "../../../zosjobs";
import { ZosmfRestClient } from "../../../rest";
import { IDownloadAllSpoolContentParms } from "./doc/input/IDownloadAllSpoolContentParms";
import { GetJobs } from "./GetJobs";


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
        for (const file of jobFiles) {
            await DownloadJobs.downloadSpoolContentCommon(session, {
                jobFile: file,
                outDir: parms.outDir,
                omitJobidDirectory: parms.omitJobidDirectory
            });
        }
    }

    /**
     * Download spool content to specified directory
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IDownloadSpoolContentParms} parms - parm object (see IDownloadSpoolContentParms interface for details)
     * @returns {Promise<string>} - promise that resolves to a string of content downloaded
     * @memberof DownloadJobs
     */
    public static async downloadSpoolContentCommon(session: AbstractSession, parms: IDownloadSpoolContentParms): Promise<string> {
        this.log.trace("Entering downloadSpoolContentCommon with parms %s", JSON.stringify(parms));
        ImperativeExpect.keysToBeDefined(parms, ["jobFile"], "You must specify a job file on your 'parms' parameter" +
            " object to the downloadSpoolContentCommon API.");

        if (parms.outDir == null) {
            parms.outDir = DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR;
        }


        const file = DownloadJobs.getSpoolDownloadFile(parms.jobFile, parms.omitJobidDirectory, parms.outDir);
        this.log.debug("Downloading spool file %s for job %s(%s) to file %s",
            parms.jobFile.ddname, parms.jobFile.jobname, parms.jobFile.jobid, file);
        IO.createDirsSyncFromFilePath(file);
        IO.createFileSync(file);

        const parameters: string = "/" + parms.jobFile.jobname + "/" + parms.jobFile.jobid +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + parms.jobFile.id + JobsConstants.RESOURCE_SPOOL_CONTENT;

        const content = await ZosmfRestClient.getExpectString(session, JobsConstants.RESOURCE + parameters);
        await IO.writeFileAsync(file, content);
        return content;
    }

    /**
     * Get the file where a specified spool file (IJobFile) would be downloaded to
     * @static
     * @param {IJobFile} jobFile - the spool file that would be downloaded
     * @param {boolean} omitJobidDirectory - if true, the job ID of the jobFile will not be included in the file path
     * @param {string} outDir - parent output directory you would like to download to
     * @returns {string} the file path that the spool file would be downloaded to
     * @memberof DownloadJobs
     */
    public static getSpoolDownloadFile(jobFile: IJobFile, omitJobidDirectory?: boolean, outDir = DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR): string {
        this.log.trace("getSpoolDownloadFile called with jobFile %s, omitJobIDDirectory: %s, outDir: %s",
            JSON.stringify(jobFile), omitJobidDirectory + "", outDir);
        let directory: string = outDir;
        if (omitJobidDirectory == null || omitJobidDirectory === false) {
            directory += IO.FILE_DELIM + jobFile.jobid;
        }

        if (jobFile.procstep != null) {
            directory += IO.FILE_DELIM + jobFile.procstep;
        }

        if (jobFile.stepname != null) {
            directory += IO.FILE_DELIM + jobFile.stepname;
        }

        return directory + IO.FILE_DELIM + jobFile.ddname + DownloadJobs.DEFAULT_JOBS_OUTPUT_FILE_EXT;
    }

    /**
     * Getter for Zowe logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
