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

import { ICommandHandler, IHandlerParameters, ImperativeError, Session } from "@brightside/imperative";
import { SubmitJobs } from "../../../src/api/SubmitJobs";
import { IJob } from "../../api/doc/response/IJob";
import { ZosmfSession } from "../../../../zosmf";

/**
 * "zos-jobs submit data-set" command handler. Submits a job (JCL) contained within a z/OS data set (PS or PDS member).
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SharedSubmitHandler implements ICommandHandler {
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
     * @memberof SharedSubmitHandler
     */
    private profile: any;

    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof SharedSubmitHandler
     */
    private arguments: any;

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs submit data-set"
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

        // Create a z/OSMF session & submit the JCL
        const session: Session = ZosmfSession.createBasicZosmfSession(this.profile);

        // Determine the positional parameter specified and invoke the correct API
        // TODO: More will be added with additional commands
        const sourceType: string = (this.arguments.dataset != null) ? "dataset" : undefined;
        let response: IJob; // Response from Submit Job
        let apiObj: any;    // API Object to set in the command JSON response
        let source: any;    // The actual JCL source (i.e. data-set name, file name, etc.)

        // Process depending on the source type
        switch (sourceType) {

            // Submit the JCL from a data set
            case "dataset":
                response = await SubmitJobs.submitJob(session, this.arguments.dataset);
                source = this.arguments.dataset;
                apiObj = response;
                break;
            default:
                throw new ImperativeError({
                    msg: `Internal submit error: Unable to determine the JCL source. ` +
                    `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }

        // Set the API object to the correct
        this.data.setObj(apiObj);
        this.data.setMessage(`Submitted JCL contained in "${sourceType}": "${source}"`);

        // Print the response to the command
        params.response.format.output({
            fields: ["jobid", "retcode", "jobname", "status"],
            output: apiObj,
            format: "object"
        });
    }
}
