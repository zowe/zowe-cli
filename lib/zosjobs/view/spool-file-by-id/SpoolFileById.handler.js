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
 * "zos-jobs view spool-by-id" command handler. Outputs a single spool DD contents.
 * @export
 * @class SubmitJobHandler
 */
class SpoolFileByIdHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the job details and spool files
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, this.mArguments.jobid);
            // Get the content, set the JSON response object, and print
            const content = yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolContentById(this.mSession, job.jobname, job.jobid, this.mArguments.spoolfileid);
            this.data.setObj(content);
            this.data.setMessage(`Spool file "${this.mArguments.spoolfileid}" content obtained for job "${job.jobname}(${job.jobid})"`);
            this.console.log(Buffer.from(content));
        });
    }
}
exports.default = SpoolFileByIdHandler;
//# sourceMappingURL=SpoolFileById.handler.js.map