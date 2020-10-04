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

import { IHandlerParameters, ImperativeError, ITaskWithStatus, TaskProgress, TaskStage } from "@zowe/imperative";
import { SubmitJobs } from "../../../src/api/SubmitJobs";
import { IJob } from "../../api/doc/response/IJob";
import { isNullOrUndefined } from "util";
import * as  fs from "fs";
import { ISubmitParms } from "../../api/doc/input/ISubmitParms";
import { ISpoolFile } from "../../api/doc/response/ISpoolFile";
import { IDownloadOptions } from "../../../../zosfiles/src/api/methods/download/doc/IDownloadOptions";
import { Get } from "../../../../zosfiles/src/api/methods/get/Get";
import { ZosmfBaseHandler } from "../../../../zosmf/src/ZosmfBaseHandler";
import getstdin = require("get-stdin");

/**
 * "zos-jobs submit data-set" command handler. Submits a job (JCL) contained within a z/OS data set (PS or PDS member).
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SharedSubmitHandler extends ZosmfBaseHandler {

    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs submit data-set"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    public async processCmd(params: IHandlerParameters): Promise<void> {
        const status: ITaskWithStatus = {
            statusMessage: "Submitting job",
            percentComplete: TaskProgress.TEN_PERCENT,
            stageName: TaskStage.IN_PROGRESS
        };
        // Save the needed parameters for convenience
        const parms: ISubmitParms = {
            jclSource: undefined,
            viewAllSpoolContent: this.mArguments.viewAllSpoolContent,
            directory: this.mArguments.directory,
            extension: this.mArguments.extension,
            lcd: this.mArguments.lcd,
            volume: this.mArguments.volume,
            waitForActive: this.mArguments.waitForActive,
            waitForOutput: this.mArguments.waitForOutput,
            task: status
        };
        const options: IDownloadOptions = {};
        params.response.progress.startBar({task: status});

        // Determine the positional parameter specified and invoke the correct API
        // TODO: More will be added with additional commands
        let sourceType: string;
        if (this.mArguments.dataset) {
            sourceType = "dataset";
        } else if (this.mArguments.localFile) {
            sourceType = "local-file";
        } else if (params.definition.name === "stdin") {
            sourceType = "stdin";
        }
        let response: IJob; // Response from Submit Job
        let apiObj: any;    // API Object to set in the command JSON response
        let spoolFilesResponse: ISpoolFile[]; // Response from view all spool content option
        let source: any;    // The actual JCL source (i.e. data-set name, file name, etc.)
        let directory: string = this.mArguments.directory;// Path where to download spool content

        // Process depending on the source type
        switch (sourceType) {

            // Submit the JCL from a data set
            case "dataset":

                // If the data set is not in catalog and volume option is provided
                if (parms.volume) {
                    options.volume = parms.volume;

                    // Get JCL from data set or member
                    const getJcl = await Get.dataSet(this.mSession, this.mArguments.dataset, options);
                    source = this.mArguments.dataset;

                    apiObj = await SubmitJobs.submitJclString(this.mSession, getJcl.toString(), parms);
                    if (parms.viewAllSpoolContent) {
                        spoolFilesResponse = apiObj;
                    }

                    break;
                } else {
                    response = await SubmitJobs.submitJob(this.mSession, this.mArguments.dataset);
                    apiObj = await SubmitJobs.checkSubmitOptions(this.mSession, parms, response);
                    source = this.mArguments.dataset;

                    if (parms.viewAllSpoolContent) {
                        spoolFilesResponse = apiObj;
                    }
                }

                break;
            // Submit the JCL from a local file
            case "local-file":
                parms.jclSource = this.mArguments.localFile;
                const JclString = fs.readFileSync(this.mArguments.localFile).toString();
                apiObj = await SubmitJobs.submitJclString(this.mSession, JclString, parms);
                source = this.mArguments.localFile;
                if (parms.viewAllSpoolContent) {
                    spoolFilesResponse = apiObj;
                }
                break;
            // Submit the JCL piped in on stdin
            case "stdin":
                const Jcl = await getstdin();
                apiObj = await SubmitJobs.submitJclString(this.mSession, Jcl, parms);
                source = "stdin";
                if (parms.viewAllSpoolContent) {
                    spoolFilesResponse = apiObj;
                }
                break;
            default:
                throw new ImperativeError({
                    msg: `Internal submit error: Unable to determine the JCL source. ` +
                        `Please contact support.`,
                    additionalDetails: JSON.stringify(params)
                });
        }

        // Print the response to the command
        if (isNullOrUndefined(spoolFilesResponse)) {
            params.response.format.output({
                fields: ["jobid", "retcode", "jobname", "status"],
                output: apiObj,
                format: "object"
            });
            // Set the API object to the correct
            this.data.setObj(apiObj);

            // Print data from spool content
        } else {
            for (const spoolFile of spoolFilesResponse) {
                if (!isNullOrUndefined(spoolFile.procName) && spoolFile.procName.length > 0) {
                    this.console.log("Spool file: %s (ID #%d, Step: %s, ProcStep: %s)",
                        spoolFile.ddName, spoolFile.id, spoolFile.stepName, spoolFile.procName);
                } else {
                    this.console.log("Spool file: %s (ID #%d, Step: %s)",
                        spoolFile.ddName, spoolFile.id, spoolFile.stepName);
                }
                this.console.log(spoolFile.data);
            }

            // Set the API object to the correct
            this.data.setObj(spoolFilesResponse);
        }

        // Print path where spool content was downloaded
        if (!isNullOrUndefined(directory) && isNullOrUndefined(spoolFilesResponse)) {
            directory = directory.includes("./") ? directory : `./${directory}`;
            params.response.console.log(`Successfully downloaded output to ${directory}/${apiObj.jobid}`);
        }
        params.response.progress.endBar();
        this.data.setMessage(`Submitted JCL contained in "${sourceType}": "${source}"`);
    }
}
