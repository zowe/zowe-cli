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

import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { ZosmfSession } from "../../../../../zosmf";
import { IJob } from "../../../api/doc/response/IJob";
import { GetJobs } from "../../../api/GetJobs";
import { IJobFile } from "../../../..";

/**
 * "zos-jobs list spool-files" command handler. Outputs a table of spool files.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SpoolFilesHandler implements ICommandHandler {
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
     * Command handler process - invoked by the command processor to handle the "zos-jobs list spool-files"
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

        // First obtain the details for the job (to acquire JOBNAME), then get the list of output spool files
        const job: IJob = await GetJobs.getJob(session, this.arguments.jobid);
        const files: IJobFile[] = await GetJobs.getSpoolFilesForJob(session, job);

        // Set the object, message, and log the prettified object
        this.data.setObj(files);
        this.data.setMessage(`"${files.length}" spool files obtained for job "${job.jobname}(${job.jobid})"`);

        // Format & print the response
        params.response.format.output({
            fields: ["id", "ddname", "procstep", "stepname"],
            output: files,
            format: "table"
        });
    }
}
