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

import { AbstractSession, ImperativeError, IRestClientResponse, IOptionsFullResponse, Headers, Logger} from "@zowe/imperative";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { GetJobs} from "./GetJobs";
import { ISearchJobsParms } from "./doc/input/ISearchJobsParms";
import { IJobFile } from "./doc/response/IJobFile";
import { IJob } from "./doc/response/IJob";
import { JobsConstants } from "./JobsConstants";
import { ZosJobsMessages } from "./JobsMessages";

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
     * @param {ISearchJobsParms} searchParms - The search parameters for the API call
     * @returns {Promise<string>} - promise that resolves to spool output
     * @throws {ImperativeError} --search-string or --search-regx must be specified
     * @memberof searchJobs
     */
    public static async searchJobs(session: AbstractSession, searchParms : ISearchJobsParms) {
        const jobName: string = searchParms.jobName;
        const searchString: string= searchParms.searchString;
        const searchRegex: string = searchParms.searchRegex;
        const caseInsensitive: boolean = searchParms.caseInsensitive;
        const searchLimit: number = searchParms.searchLimit;
        const fileLimit: number = searchParms.fileLimit;

        Logger.getAppLogger().info("SearchJobs.searchJobs() called!");
        let replyBuffer:string = "";

        // Validate that a search string or regex parameter was passed
        if(searchRegex === undefined && searchString === undefined){
            throw new ImperativeError({ msg: ZosJobsMessages.missingSearchOption.message });
        }

        // Validate that both options are not passed on the same call
        if(searchRegex !== undefined && searchString !== undefined){
            throw new ImperativeError({ msg: ZosJobsMessages.missingSearchOption.message });
        }

        const jobsList: IJob[] = await GetJobs.getJobsByPrefix(session, jobName);
        let fileCount = 0;
        for(const job of jobsList )
        {
            // Get spool files
            const spoolFiles: IJobFile[] = await GetJobs.getSpoolFilesForJob(session, job);

            for (const spoolFile of spoolFiles) {
                fileCount++;
                let startingLine = 0;
                let lineCount = 1;

                //If the max number of files have been search then end the search.
                if(fileCount > fileLimit){
                    Logger.getAppLogger().debug("searchJobs() - File limit reached");
                    return replyBuffer;
                }

                while(startingLine >= 0){
                    const spoolContent = await this.searchSpoolContentCommon(session, searchString, searchRegex,
                        caseInsensitive, spoolFile, startingLine);
                    if(spoolContent.dataString.length > 0){
                        if(startingLine == 0){
                            if (spoolFile.procstep != null && spoolFile.procstep.length > 0) {
                                replyBuffer = replyBuffer + "Job Name: " + job.jobname + " Job Id: " + job.jobid +
                                    " Spool file: " + spoolFile.ddname + "(ID #" + spoolFile.id + " Step: " +
                                    spoolFile.stepname + " ProcStep: " + spoolFile.procstep +")" + "\n";

                            } else {
                                replyBuffer = replyBuffer + "Job Name: " + job.jobname + " Job Id: " + job.jobid +
                                    " Spool file: " + spoolFile.ddname + "(ID #" + spoolFile.id + " Step: " +
                                    spoolFile.stepname + ")" + "\n";
                            }
                        }
                        const recordRange:string = spoolContent.response.headers['x-ibm-record-range'];
                        const lineNumberString:string = recordRange.substring(0, recordRange.indexOf(','));
                        startingLine = Number(lineNumberString) + 1;
                        replyBuffer = replyBuffer + " Line " + startingLine + " : " + spoolContent.dataString;

                        // If the search length is exceeded then end the search of this file.
                        lineCount++;
                        if(lineCount > searchLimit){
                            Logger.getAppLogger().debug("searchJobs() - Search limit reached");
                            startingLine = -1;
                            replyBuffer = replyBuffer + "\n";
                        }
                    }
                    else{
                        // If nothing more is found in this file, move on to the next one.
                        if(startingLine > 0){
                            replyBuffer = replyBuffer + "\n";
                        }
                        startingLine = -1;
                    }
                }
            }
        }

        return replyBuffer;
    }

    /**
     * Get jobs (defaults to the user ID of the session as owner)
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} searchString - The string to search for in the spool output
     * @param {string} searchRegex - The regex to search for in the spool output
     * @param {boolean} caseInsensitive - Specify if a search is case sensitive
     * @param {IJobFile} jobFile - The job spool file to search
     * @param {number} startingLine - The line to start the searching from
     * @returns {Promise<IRestClientResponse>} - promise that resolves to spool output and response headers
     * @memberof searchJobs
     */
    private static async searchSpoolContentCommon(session: AbstractSession,
        searchString : string,
        searchRegex:string,
        caseInsensitive:boolean,
        jobFile: IJobFile,
        startingLine: number) {
        Logger.getAppLogger().trace("SearchJobs.getSpoolContentCommon()");
        const headers: any[] = [Headers.TEXT_PLAIN_UTF8];

        let parameters: string = "/" + encodeURIComponent(jobFile.jobname) + "/" + encodeURIComponent(jobFile.jobid) +
            JobsConstants.RESOURCE_SPOOL_FILES + "/" + encodeURIComponent(jobFile.id) + JobsConstants.RESOURCE_SPOOL_CONTENT;

        if(searchString != undefined)
            parameters += "?search=" + searchString + "&maxreturnsize=1";
        else
            parameters += "?research=" + searchRegex + "&maxreturnsize=1";

        if(caseInsensitive === false)
            parameters += "&insensitive=false";

        if (startingLine > 0) {
            headers.push({ [ZosmfHeaders.X_IBM_RECORD_RANGE]: startingLine+"-0"});
        }

        const requestOptions: IOptionsFullResponse = {
            resource: JobsConstants.RESOURCE + parameters,
            reqHeaders : headers
        };
        const request: IRestClientResponse = await ZosmfRestClient.getExpectFullResponse(session, requestOptions);

        return request;
    }
}
