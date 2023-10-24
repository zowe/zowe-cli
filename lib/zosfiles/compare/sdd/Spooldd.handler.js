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
const CompareBase_handler_1 = require("../CompareBase.handler");
/**
 * Handler to compare spooldd's content
 * @export
 */
class SpoolddHandler extends CompareBase_handler_1.CompareBaseHandler {
    getFile1(session, args, helper) {
        return __awaiter(this, void 0, void 0, function* () {
            const { jobName, jobId, spoolId } = helper.prepareSpoolDescriptor(args.spoolDescription1);
            return yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
        });
    }
    getFile2(session, args, helper) {
        return __awaiter(this, void 0, void 0, function* () {
            const { jobName, jobId, spoolId } = helper.prepareSpoolDescriptor(args.spoolDescription2);
            return yield zos_jobs_for_zowe_sdk_1.GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
        });
    }
}
exports.default = SpoolddHandler;
//# sourceMappingURL=Spooldd.handler.js.map