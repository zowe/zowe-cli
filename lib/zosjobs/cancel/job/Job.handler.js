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
const zos_jobs_for_zowe_sdk_1 = require("@zowe/zos-jobs-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * "zos-jobs cancel job" command handler. Cancel a job by ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
class JobHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs cancel job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            // Force yargs `jobid` parameter to be a string
            const jobid = this.arguments.jobid + "";
            // Get the job details
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, jobid);
            // Cancel the job
            const response = yield zos_jobs_for_zowe_sdk_1.CancelJobs.cancelJobForJob(this.mSession, job, this.arguments.modifyVersion);
            let message;
            if (this.arguments.modifyVersion == null || this.arguments.modifyVersion === "1.0") {
                message = `Successfully submitted request to cancel job ${job.jobname} (${jobid})`;
            }
            else if (this.arguments.modifyVersion === "2.0" && (response === null || response === void 0 ? void 0 : response.status) === "0") {
                message = `Successfully canceled job ${job.jobname} (${jobid})`;
            }
            else {
                throw new imperative_1.ImperativeError({
                    msg: `Failed to cancel job ${job.jobname} (${jobid})`,
                    additionalDetails: response === null || response === void 0 ? void 0 : response.message,
                    errorCode: response === null || response === void 0 ? void 0 : response["internal-code"]
                });
            }
            // Print message to console
            this.console.log(message);
            // Return as an object when using --response-format-json
            this.data.setMessage(message);
            this.data.setObj(job);
        });
    }
}
exports.default = JobHandler;
//# sourceMappingURL=Job.handler.js.map