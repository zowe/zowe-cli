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

import { ICommandHandler, IHandlerParameters, Session } from "@brightside/imperative";
import { ZosmfSession } from "../../../../../zosmf";
import { DownloadJobs, IJob, GetJobs, IDownloadAllSpoolContentParms } from "../../../../";

/**
 * "zos-jobs download output" command handler. Download each spool DD to a separate file.
 * @export
 * @class OutputHandler
 * @implements {ICommandHandler}
 */
export default class OutputHandler implements ICommandHandler {
    /**
     * Convenience accessor for the response APIs
     * @private
     * @type {*}
     * @memberof OutputHandler
     */
    private console: any;
    private data: any;

    /**
     * The z/OSMF profile for this command
     * @private
     * @type {*}
     * @memberof OutputHandler
     */
    private profile: any;

    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof OutputHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs download output"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OutputHandler
     */
    public async process(params: IHandlerParameters): Promise<void> {
        // Save the needed parameters for convenience
        this.console = params.response.console;
        this.data = params.response.data;
        this.profile = params.profiles.get("zosmf");
        this.arguments = params.arguments;

        const response: any = {};
        const jobid: string = this.arguments.jobid + "";
        const outDir: string = this.arguments.directory;
        const omitJobidDirectory: boolean = !!this.arguments.ojd;
        const extension: string = this.arguments.extension;
        const session: Session = ZosmfSession.createBasicZosmfSession(this.profile);

        // Get the job details
        const job: IJob = await GetJobs.getJob(session, jobid);
        const options: IDownloadAllSpoolContentParms = {
            jobname: job.jobname,
            jobid,
            outDir,
            omitJobidDirectory,
            extension,
        };
        // Download 'em all
        await DownloadJobs.downloadAllSpoolContentCommon(session, options);

        if(options.outDir == null) {
            options.outDir = DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR;
        }

        this.console.log(`Successfully downloaded the job output\nDestination: ${options.outDir}`);

        // Return as an object when using --response-format-json
        this.data.setObj(response);
    }
}
