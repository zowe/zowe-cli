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
 * "zos-jobs download output" command handler. Download each spool DD to a separate file.
 * @export
 * @class OutputHandler
 * @implements {ICommandHandler}
 */
class OutputHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs download output"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OutputHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = {};
            const jobid = this.mArguments.jobid + "";
            const outDir = this.mArguments.directory;
            const omitJobidDirectory = !!this.mArguments.ojd;
            const extension = this.mArguments.extension;
            const binary = this.mArguments.binary;
            const record = this.mArguments.record;
            // Get the job details
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, jobid);
            const options = {
                jobname: job.jobname,
                jobid,
                outDir,
                omitJobidDirectory,
                extension,
                binary,
                record
            };
            // Download 'em all
            yield zos_jobs_for_zowe_sdk_1.DownloadJobs.downloadAllSpoolContentCommon(this.mSession, options);
            if (options.outDir == null) {
                options.outDir = zos_jobs_for_zowe_sdk_1.DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR;
            }
            this.console.log(`Successfully downloaded the job output\nDestination: ${options.outDir}`);
            // Return as an object when using --response-format-json
            this.data.setObj(response);
        });
    }
}
exports.default = OutputHandler;
//# sourceMappingURL=Output.handler.js.map