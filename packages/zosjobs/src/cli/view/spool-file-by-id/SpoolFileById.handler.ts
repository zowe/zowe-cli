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
import { IJob } from "../../../api/doc/response/IJob";
import { GetJobs } from "../../../api/GetJobs";

/**
 * "zos-jobs view spool-by-id" command handler. Outputs a single spool DD contents.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SpoolFileByIdHandler implements ICommandHandler {
    /**
     * Convenience accessor for the response APIs
     * @private
     * @type {*}
     * @memberof SubmitDataSetHandler
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
     * Command handler process - invoked by the command processor to handle the "zos-jobs view job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    public async process(params: IHandlerParameters): Promise<void> {
        // Save the needed parameters for convenience
        this.console = params.response.console;
        this.data = params.response.data;
        this.profile = params.profiles.get("zosmf");
        this.arguments = params.arguments;

        // Create a z/OSMF session
        const session: Session = ZosmfSession.createBasicZosmfSession(this.profile);

        // Get the job details and spool files
        const job: IJob = await GetJobs.getJob(session, this.arguments.jobid);

        // Get the content, set the JSON response object, and print
        const content: string = await GetJobs.getSpoolContentById(session, job.jobname, job.jobid, this.arguments.spoolfileid);
        this.data.setObj(content);
        this.data.setMessage(`Spool file "${this.arguments.spoolfileid}" content obtained for job "${job.jobname}(${job.jobid})"`);
        this.console.log(Buffer.from(content));
    }
}
