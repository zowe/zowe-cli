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
import { DownloadJobs, GetJobs, IDownloadAllSpoolContentParms, IJob } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * "zos-jobs download output" command handler. Download each spool DD to a separate file.
 * @export
 * @class OutputHandler
 * @implements {ICommandHandler}
 */
export default class OutputHandler extends ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs download output"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OutputHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        const response: any = {};
        const jobid: string = this.mArguments.jobid + "";
        const outDir: string = this.mArguments.directory;
        const omitJobidDirectory: boolean = !!this.mArguments.ojd;
        const extension: string = this.mArguments.extension;
        const binary: boolean = this.mArguments.binary;
        const record: boolean = this.mArguments.record;
        const encoding: string = this.mArguments.encoding;
        // Get the job details
        const job: IJob = await GetJobs.getJob(this.mSession, jobid);
        const options: IDownloadAllSpoolContentParms = {
            jobname: job.jobname,
            jobid,
            outDir,
            omitJobidDirectory,
            extension,
            binary,
            record,
            encoding
        };
        // Download 'em all
        await DownloadJobs.downloadAllSpoolContentCommon(this.mSession, options);

        if (options.outDir == null) {
            options.outDir = DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR;
        }

        this.console.log(`Successfully downloaded the job output\nDestination: ${options.outDir}`);

        // Return as an object when using --response-format-json
        this.data.setObj(response);
    }
}
