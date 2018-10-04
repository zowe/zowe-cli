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
import { IJob, GetJobs, DeleteJobs } from "../../../../";

/**
 * "zos-jobs delete job" command handler. Delete (purge) a job by ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
export default class JobHandler implements ICommandHandler {
    /**
     * Convenience accessor for the response APIs
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private console: any;
    private data: any;

    /**
     * The z/OSMF profile for this command
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private profile: any;

    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs delete job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    public async process(params: IHandlerParameters): Promise<void> {
        // Save the needed parameters for convenience
        this.console = params.response.console;
        this.data = params.response.data;
        this.profile = params.profiles.get("zosmf");
        this.arguments = params.arguments;

        // Force yargs `jobid` parameter to be a string
        const jobid: string = this.arguments.jobid + "";
        // Create a z/OSMF session
        const session: Session = ZosmfSession.createBasicZosmfSession(this.profile);
        // Get the job details
        const job: IJob = await GetJobs.getJob(session, jobid);
        // Delete the job
        await DeleteJobs.deleteJobForJob(session, job);

        const message: string = `Successfully deleted job ${job.jobname} (${jobid})`;
        // Print message to console
        this.console.log(message);

        // Return as an object when using --response-format-json
        this.data.setMessage(message);
        this.data.setObj(job);
    }
}
