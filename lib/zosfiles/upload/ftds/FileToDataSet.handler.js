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
/**
 * Handler to upload content from a file to a data set
 * @export
 */
class FileToDataSetHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = {
                percentComplete: 0,
                statusMessage: "Uploading to data set",
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({ task });
            const response = yield zos_files_for_zowe_sdk_1.Upload.fileToDataset(session, commandParameters.arguments.inputfile, commandParameters.arguments.dataSetName, {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                record: commandParameters.arguments.record,
                encoding: commandParameters.arguments.encoding,
                task,
                responseTimeout: commandParameters.arguments.responseTimeout
            });
            if (response.apiResponse) {
                let skipCount = 0;
                let successCount = 0;
                let errorCount = 0;
                response.apiResponse.forEach((element) => {
                    if (element.success === true) {
                        const formatMessage = imperative_1.TextUtils.prettyJson(element);
                        commandParameters.response.console.log(formatMessage);
                        successCount++;
                    }
                    else if (element.success === false) {
                        const formatMessage = imperative_1.TextUtils.prettyJson(element);
                        commandParameters.response.console.error(imperative_1.TextUtils.chalk.red(formatMessage));
                        errorCount++;
                    }
                    else {
                        skipCount++;
                    }
                });
                commandParameters.response.console.log(imperative_1.TextUtils.prettyJson({
                    file_to_upload: response.apiResponse.length,
                    success: successCount,
                    error: errorCount,
                    skipped: skipCount
                }));
            }
            return response;
        });
    }
}
exports.default = FileToDataSetHandler;
//# sourceMappingURL=FileToDataSet.handler.js.map