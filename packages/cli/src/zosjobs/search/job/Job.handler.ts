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

import { IHandlerParameters } from "@zowe/imperative";
import { SearchJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { ISearchJobsParms } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs search job" command handler. Modify a job by name and ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
export default class JobHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs search job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        this.arguments = params.arguments;
        const searchParms: ISearchJobsParms = { jobName : this.arguments.jobname,
            caseInsensitive: this.arguments.caseInsensitive,
            searchLimit: this.arguments.searchLimit,
            fileLimit: this.arguments.fileLimit};

        if( this.arguments.searchString != undefined)
            searchParms.searchString = encodeURI(this.arguments.searchString);

        if(this.arguments.searchRegex != undefined)
            searchParms.searchRegex = encodeURI(this.arguments.searchRegex);

        // Get the job details
        const dsContentBuf:string = await SearchJobs.searchJobs(this.mSession, searchParms);

        // If no string was found then set the exit code
        if(dsContentBuf.length == 0){
            this.data.setExitCode(1);
        }else{
            this.data.setExitCode(0);
        }

        this.data.setObj(dsContentBuf);
        this.console.log(Buffer.from(dsContentBuf));
    }
}
