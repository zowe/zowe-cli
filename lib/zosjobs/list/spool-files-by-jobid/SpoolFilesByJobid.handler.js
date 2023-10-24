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
 * "zos-jobs list spool-files" command handler. Outputs a table of spool files.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
class SpoolFilesHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs list spool-files"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.arguments = params.arguments;
            // First obtain the details for the job (to acquire JOBNAME), then get the list of output spool files
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, this.arguments.jobid);
            const files = yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolFilesForJob(this.mSession, job);
            // Set the object, message, and log the prettified object
            this.data.setObj(files);
            this.data.setMessage(`"${files.length}" spool files obtained for job "${job.jobname}(${job.jobid})"`);
            // Format & print the response
            params.response.format.output({
                fields: ["id", "ddname", "procstep", "stepname"],
                output: files,
                format: "table"
            });
        });
    }
}
exports.default = SpoolFilesHandler;
//# sourceMappingURL=SpoolFilesByJobid.handler.js.map