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
 * "zos-jobs view all-spool-content" command handler. Outputs details regarding a z/OS job.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
class AllSpoolContentHandler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view all-spool-content"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the job details
            const job = yield zos_jobs_for_zowe_sdk_1.GetJobs.getJob(this.mSession, this.mArguments.jobid);
            // Get spool files
            const spoolFiles = yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolFilesForJob(this.mSession, job);
            const responseArray = [];
            for (const spoolFile of spoolFiles) {
                const spoolContent = yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolContent(this.mSession, spoolFile);
                if (spoolFile.procstep != null && spoolFile.procstep.length > 0) {
                    this.console.log("Spool file: %s (ID #%d, Step: %s, ProcStep: %s)", spoolFile.ddname, spoolFile.id, spoolFile.stepname, spoolFile.procstep);
                }
                else {
                    this.console.log("Spool file: %s (ID #%d, Step: %s)", spoolFile.ddname, spoolFile.id, spoolFile.stepname);
                }
                this.console.log(spoolContent);
                responseArray.push({
                    id: spoolFile.id,
                    ddName: spoolFile.ddname,
                    stepName: spoolFile.stepname,
                    procName: spoolFile.procstep,
                    data: spoolContent.toString(),
                });
            }
            // Return as an object when using --response-format-json
            // This differs from the initial implementation, but we should probably return more then the last spool file.
            this.data.setObj(responseArray);
        });
    }
}
exports.default = AllSpoolContentHandler;
//# sourceMappingURL=AllSpoolContent.handler.js.map