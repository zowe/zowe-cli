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
 * Handler to stream data from stdin to a data set
 * @export
 */
class StdinToDataSetHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = {
                percentComplete: 0,
                statusMessage: "Uploading stdin to data set",
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({ task });
            const result = yield zos_files_for_zowe_sdk_1.Upload.streamToDataSet(session, commandParameters.stdin, commandParameters.arguments.dataSetName, {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                record: commandParameters.arguments.record,
                task,
                responseTimeout: commandParameters.arguments.responseTimeout
            });
            if (result.success) {
                const formatMessage = imperative_1.TextUtils.prettyJson({
                    success: result.success,
                    from: "stdin",
                    to: commandParameters.arguments.dataSetName
                });
                commandParameters.response.console.log(formatMessage);
            }
            return result;
        });
    }
}
exports.default = StdinToDataSetHandler;
//# sourceMappingURL=StdinToDataSet.handler.js.map