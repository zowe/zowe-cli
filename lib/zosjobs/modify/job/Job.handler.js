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
 * "zos-jobs modify job" command handler. Modify a job by name and ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
class JobHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs modify job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            // Force yargs parameters to be proper types
            const jobid = this.arguments.jobid + "";
            const hold = this.arguments.hold;
            const release = this.arguments.release;
            // Get the job details
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, jobid);
            // Modify the job and print output
            const response = yield zos_jobs_for_zowe_sdk_1.ModifyJobs.modifyJob(this.mSession, { jobname: job.jobname, jobid }, { jobclass: this.arguments.jobclass, hold, release });
            imperative_1.ImperativeExpect.toNotBeNullOrUndefined(response, "You must specify at least one option to modify your job with.");
            this.data.setObj(job);
            let mergedMessage = "";
            if (this.arguments.jobclass) {
                if (response.message.includes("Job class invalid")) {
                    mergedMessage = "\nUnsuccessful. Job class '" + this.arguments.jobclass + "' invalid";
                }
                else {
                    mergedMessage = "\nSuccessful. Class Change: " + job.class + " -> " + this.arguments.jobclass;
                }
            }
            if (this.arguments.hold || this.arguments.release) {
                if (this.arguments.hold) {
                    mergedMessage = mergedMessage + "\nSuccessful. Job Held";
                }
                else {
                    mergedMessage = mergedMessage + "\nSuccessful. Job Released";
                }
            }
            this.console.log(mergedMessage);
        });
    }
}
exports.default = JobHandler;
//# sourceMappingURL=Job.handler.js.map