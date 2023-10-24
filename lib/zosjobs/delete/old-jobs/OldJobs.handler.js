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
const core_for_zowe_sdk_1 = require("@zowe/core-for-zowe-sdk");
const zos_jobs_for_zowe_sdk_1 = require("@zowe/zos-jobs-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * "zos-jobs delete old-jobs" command handler. Delete (purge) multiple jobs in OUTPUT status.
 * @export
 * @class OldJobsHandler
 * @implements {ICommandHandler}
 */
class OldJobsHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs delete job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OldJobsHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            // Retrieve the list of user's jobs
            const prefix = this.arguments.prefix || zos_jobs_for_zowe_sdk_1.JobsConstants.DEFAULT_PREFIX;
            const jobs = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJobsByPrefix(this.mSession, prefix);
            // Handle no jobs
            if (jobs.length === 0) {
                let notFoundMessage = "No jobs found";
                if (prefix != null && prefix.length > 0) {
                    notFoundMessage += ` with prefix ${prefix}`;
                }
                this.console.log(notFoundMessage);
                return;
            }
            // Loop through the jobs and delete those in OUTPUT status
            const deletedJobs = [];
            for (const job of jobs) {
                if (job.status === zos_jobs_for_zowe_sdk_1.JOB_STATUS.OUTPUT) {
                    deletedJobs.push(job);
                }
            }
            const deleteJobPromise = (job) => __awaiter(this, void 0, void 0, function* () {
                const response = yield zos_jobs_for_zowe_sdk_1.DeleteJobs.deleteJobForJob(this.mSession, job, this.arguments.modifyVersion);
                if (response != null && response.status !== "0") {
                    throw new imperative_1.ImperativeError({
                        msg: `Failed to delete job ${job.jobname} (${job.jobid})`,
                        additionalDetails: response === null || response === void 0 ? void 0 : response.message,
                        errorCode: response === null || response === void 0 ? void 0 : response["internal-code"]
                    });
                }
            });
            if (this.arguments.maxConcurrentRequests === 0) {
                yield Promise.all(deletedJobs.map(deleteJobPromise));
            }
            else {
                yield (0, core_for_zowe_sdk_1.asyncPool)(this.arguments.maxConcurrentRequests, deletedJobs, deleteJobPromise);
            }
            const message = `Successfully deleted ${deletedJobs.length} job${deletedJobs.length === 1 ? "" : "s"}`;
            // Format the output
            this.console.log(message);
            params.response.format.output({
                fields: ["jobname", "jobid", "status"],
                output: deletedJobs,
                format: "table"
            });
            // Return as an object when using --response-format-json
            this.data.setMessage(message);
            this.data.setObj(deletedJobs);
        });
    }
}
exports.default = OldJobsHandler;
//# sourceMappingURL=OldJobs.handler.js.map