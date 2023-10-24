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
 * Handler to download all members from a pds
 * @export
 */
class DataSetMatchingHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensionMap = {};
            try {
                if (commandParameters.arguments.extensionMap) {
                    commandParameters.arguments.extensionMap = commandParameters.arguments.extensionMap.toLowerCase();
                    const unoptimizedMap = commandParameters.arguments.extensionMap.split(",");
                    for (const entry of unoptimizedMap) {
                        const splitEntry = entry.split("=");
                        imperative_1.ImperativeExpect.toBeEqual(splitEntry.length, 2);
                        extensionMap[splitEntry[0]] = splitEntry[1];
                    }
                }
            }
            catch (err) {
                throw new imperative_1.ImperativeError({ msg: "An error occurred processing the extension map.", causeErrors: err });
            }
            const listStatus = {
                statusMessage: "Searching for data sets",
                percentComplete: 0,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            const listOptions = {
                excludePatterns: (_a = commandParameters.arguments.excludePatterns) === null || _a === void 0 ? void 0 : _a.split(","),
                maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                task: listStatus,
                responseTimeout: commandParameters.arguments.responseTimeout
            };
            commandParameters.response.progress.startBar({ task: listStatus });
            const response = yield zos_files_for_zowe_sdk_1.List.dataSetsMatchingPattern(session, commandParameters.arguments.pattern.split(","), listOptions);
            commandParameters.response.progress.endBar();
            if (response.success) {
                commandParameters.response.console.log(`\r${response.commandResponse}\n`);
            }
            else {
                return response;
            }
            const downloadStatus = {
                statusMessage: "Downloading data sets",
                percentComplete: 0,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            const downloadOptions = {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                record: commandParameters.arguments.record,
                encoding: commandParameters.arguments.encoding,
                directory: commandParameters.arguments.directory,
                extension: commandParameters.arguments.extension,
                extensionMap: commandParameters.arguments.extensionMap ? extensionMap : undefined,
                maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                preserveOriginalLetterCase: commandParameters.arguments.preserveOriginalLetterCase,
                failFast: commandParameters.arguments.failFast,
                task: downloadStatus,
                responseTimeout: commandParameters.arguments.responseTimeout
            };
            commandParameters.response.progress.startBar({ task: downloadStatus });
            return zos_files_for_zowe_sdk_1.Download.allDataSets(session, response.apiResponse, downloadOptions);
        });
    }
}
exports.default = DataSetMatchingHandler;
//# sourceMappingURL=DataSetMatching.handler.js.map