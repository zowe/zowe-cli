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
const zos_jobs_for_zowe_sdk_1 = require("@zowe/zos-jobs-for-zowe-sdk");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
/**
 * Handler for the "zos-jobs list jobs" command.
 * @export
 * @class JobsHandler
 * @implements {ICommandHandler}
 */
class JobsHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Handler for the "zos-jobs list jobs" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Obtain the list of jobs - by default uses the session user and * for owner and prefix.
            const owner = (params.arguments.owner != null) ? params.arguments.owner : null;
            const prefix = (params.arguments.prefix != null) ? params.arguments.prefix : zos_jobs_for_zowe_sdk_1.JobsConstants.DEFAULT_PREFIX;
            const execData = params.arguments.execData;
            const jobs = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJobsCommon(this.mSession, { owner, prefix, execData });
            // Populate the response object
            params.response.data.setObj(jobs);
            params.response.data.setMessage(`List of jobs returned for prefix "${prefix}" and owner "${owner}"`);
            if (!params.arguments.execData) {
                // Format the output with the default fields
                params.response.format.output({
                    fields: ["jobid", "retcode", "jobname", "status"],
                    output: jobs,
                    format: "table"
                });
            }
            else {
                // Format the output with the fields showing execution data
                params.response.format.output({
                    fields: ["jobid", "retcode", "jobname", "status", "exec-system", "exec-member", "exec-submitted", "exec-started", "exec-ended"],
                    output: jobs,
                    format: "table",
                    header: true
                });
            }
        });
    }
}
exports.default = JobsHandler;
//# sourceMappingURL=Jobs.handler.js.map