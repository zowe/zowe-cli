"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");
const fs = require("fs");
const zos_jobs_for_zowe_sdk_1 = require("@zowe/zos-jobs-for-zowe-sdk");
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
const getStream = require("get-stream");
/**
 * "zos-jobs submit data-set" command handler. Submits a job (JCL) contained within a z/OS data set (PS or PDS member).
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
class SharedSubmitHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs submit data-set"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = {
                statusMessage: "Submitting job",
                percentComplete: imperative_1.TaskProgress.TEN_PERCENT,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            // Save the needed parameters for convenience
            const parms = {
                jclSource: undefined,
                viewAllSpoolContent: this.mArguments.viewAllSpoolContent,
                directory: this.mArguments.directory,
                extension: this.mArguments.extension,
                volume: this.mArguments.volume,
                waitForActive: this.mArguments.waitForActive,
                waitForOutput: this.mArguments.waitForOutput,
                task: status,
                jclSymbols: this.mArguments.jclSymbols
            };
            const options = {};
            params.response.progress.startBar({ task: status });
            // Determine the positional parameter specified and invoke the correct API
            // TODO: More will be added with additional commands
            let sourceType;
            if (this.mArguments.dataset) {
                sourceType = "dataset";
            }
            else if (this.mArguments.file) {
                sourceType = "uss-file";
            }
            else if (this.mArguments.localFile) {
                sourceType = "local-file";
            }
            else if (params.definition.name === "stdin") {
                sourceType = "stdin";
            }
            let response; // Response from Submit Job
            let apiObj; // API Object to set in the command JSON response
            let spoolFilesResponse; // Response from view all spool content option
            let source; // The actual JCL source (i.e. data-set name, file name, etc.)
            let directory = this.mArguments.directory; // Path where to download spool content
            // Process depending on the source type
            switch (sourceType) {
                // Submit the JCL from a data set
                case "dataset":
                    // If the data set is not in catalog and volume option is provided
                    if (parms.volume) {
                        options.volume = parms.volume;
                        // Get JCL from data set or member
                        const getJcl = yield zos_files_for_zowe_sdk_1.Get.dataSet(this.mSession, this.mArguments.dataset, options);
                        source = this.mArguments.dataset;
                        apiObj = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.submitJclString(this.mSession, getJcl.toString(), parms);
                        if (parms.viewAllSpoolContent) {
                            spoolFilesResponse = apiObj;
                        }
                        break;
                    }
                    else {
                        response = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.submitJobCommon(this.mSession, { jobDataSet: this.mArguments.dataset,
                            jclSymbols: this.mArguments.jclSymbols });
                        apiObj = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.checkSubmitOptions(this.mSession, parms, response);
                        source = this.mArguments.dataset;
                        if (parms.viewAllSpoolContent) {
                            spoolFilesResponse = apiObj;
                        }
                    }
                    break;
                // Submit JCL from a USS file
                case "uss-file":
                    response = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.submitJobCommon(this.mSession, { jobUSSFile: this.mArguments.file,
                        jclSymbols: this.mArguments.jclSymbols });
                    apiObj = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.checkSubmitOptions(this.mSession, parms, response);
                    source = this.mArguments.ussfile;
                    if (parms.viewAllSpoolContent) {
                        spoolFilesResponse = apiObj;
                    }
                    break;
                // Submit the JCL from a local file
                case "local-file": {
                    parms.jclSource = this.mArguments.localFile;
                    const JclString = fs.readFileSync(this.mArguments.localFile).toString();
                    apiObj = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.submitJclString(this.mSession, JclString, parms);
                    source = this.mArguments.localFile;
                    if (parms.viewAllSpoolContent) {
                        spoolFilesResponse = apiObj;
                    }
                    break;
                }
                // Submit the JCL piped in on stdin
                case "stdin": {
                    const Jcl = yield getStream(params.stdin);
                    apiObj = yield zos_jobs_for_zowe_sdk_1.SubmitJobs.submitJclString(this.mSession, Jcl, parms);
                    source = "stdin";
                    if (parms.viewAllSpoolContent) {
                        spoolFilesResponse = apiObj;
                    }
                    break;
                }
                default:
                    throw new imperative_1.ImperativeError({
                        msg: `Internal submit error: Unable to determine the JCL source. ` +
                            `Please contact support.`,
                        additionalDetails: JSON.stringify(params)
                    });
            }
            // Print the response to the command
            if (spoolFilesResponse == null) {
                params.response.format.output({
                    fields: ["jobid", "retcode", "jobname", "status"],
                    output: apiObj,
                    format: "object"
                });
                // Set the API object to the correct
                this.data.setObj(apiObj);
                // Print data from spool content
            }
            else {
                for (const spoolFile of spoolFilesResponse) {
                    if (spoolFile.procName != null && spoolFile.procName.length > 0) {
                        this.console.log("Spool file: %s (ID #%d, Step: %s, ProcStep: %s)", spoolFile.ddName, spoolFile.id, spoolFile.stepName, spoolFile.procName);
                    }
                    else {
                        this.console.log("Spool file: %s (ID #%d, Step: %s)", spoolFile.ddName, spoolFile.id, spoolFile.stepName);
                    }
                    this.console.log(spoolFile.data);
                }
                // Set the API object to the correct
                this.data.setObj(spoolFilesResponse);
            }
            // Print path where spool content was downloaded
            if (directory != null && spoolFilesResponse == null) {
                directory = directory.includes("./") ? directory : `./${directory}`;
                params.response.console.log(`Successfully downloaded output to ${directory}/${apiObj.jobid}`);
            }
            params.response.progress.endBar();
            this.data.setMessage(`Submitted JCL contained in "${sourceType}": "${source}"`);
        });
    }
}
exports.default = SharedSubmitHandler;
//# sourceMappingURL=Submit.shared.handler.js.map