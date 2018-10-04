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
import { JobsConstants } from "../../../..";

/**
 * Handler for the "zos-jobs list jobs" command.
 * @export
 * @class JobsHandler
 * @implements {ICommandHandler}
 */
export default class JobsHandler implements ICommandHandler {
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
     * Handler for the "zos-jobs list jobs" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    public async process(params: IHandlerParameters): Promise<void> {
        // Save the needed parameters for convenience
        this.console = params.response.console;
        this.data = params.response.data;
        this.profile = params.profiles.get("zosmf");
        this.arguments = params.arguments;

        // Create a z/OSMF session
        const session: Session = ZosmfSession.createBasicZosmfSession(this.profile);

        // Obtain the list of jobs - by default uses the session user and * for owner and prefix.
        const prefix: string = (params.arguments.owner != null) ? params.arguments.owner : session.ISession.user;
        const owner: string = (params.arguments.prefix != null) ? params.arguments.prefix : JobsConstants.DEFAULT_PREFIX;
        const jobs: IJob[] = await GetJobs.getJobsByOwnerAndPrefix(session, prefix, owner);

        // Populate the response object
        params.response.data.setObj(jobs);
        params.response.data.setMessage(`List of jobs returned for prefix "${prefix}" and owner "${owner}"`);

        // Format the output with the default fields
        params.response.format.output({
            fields: ["jobid", "retcode", "jobname", "status"],
            output: jobs,
            format: "table"
        });
    }
}
