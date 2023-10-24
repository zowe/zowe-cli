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
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const ZosFilesBase_handler_1 = require("../../ZosFilesBase.handler");
const ZosFiles_utils_1 = require("../../ZosFiles.utils");
/**
 * Handler to copy a data set.
 */
class DsclpHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourceDataset = (0, ZosFiles_utils_1.getDataSet)(commandParameters.arguments.fromDataSetName);
            const targetDataset = (0, ZosFiles_utils_1.getDataSet)(commandParameters.arguments.toDataSetName);
            const options = {
                "from-dataset": sourceDataset,
                enq: commandParameters.arguments.enq,
                replace: commandParameters.arguments.replace,
                responseTimeout: commandParameters.arguments.responseTimeout,
                targetVolser: commandParameters.arguments.targetVolser,
                targetManagementClass: commandParameters.arguments.targetManagementClass,
                targetStorageClass: commandParameters.arguments.targetStorageClass,
                targetDataClass: commandParameters.arguments.targetDataClass,
                promptFn: this.promptForOverwrite(commandParameters.response.console)
            };
            const sourceOptions = {
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                record: commandParameters.arguments.record,
                volume: commandParameters.arguments.volume
            };
            const targetSession = new imperative_1.Session(commandParameters.arguments.targetZosmfSession);
            return zos_files_for_zowe_sdk_1.Copy.dataSetCrossLPAR(session, targetDataset, options, sourceOptions, targetSession);
        });
    }
    /**
     * Private function to prompt user if they wish to overwrite an existing dataset.
     */
    promptForOverwrite(console) {
        return (targetDSN) => __awaiter(this, void 0, void 0, function* () {
            const answer = yield console.prompt(`The dataset '${targetDSN}' already exists on the target system. Do you want to overwrite it? [y/N]: `);
            return (answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"));
        });
    }
}
exports.default = DsclpHandler;
//# sourceMappingURL=Dsclp.handler.js.map