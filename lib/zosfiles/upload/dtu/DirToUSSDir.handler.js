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
const path = require("path");
/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */
class DirToUSSDirHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = {
                statusMessage: "Uploading all files",
                percentComplete: 0,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            let inputDir;
            // resolving to full path if local path passed is not absolute
            if (path.isAbsolute(commandParameters.arguments.inputDir)) {
                inputDir = commandParameters.arguments.inputDir;
            }
            else {
                inputDir = path.resolve(commandParameters.arguments.inputDir);
            }
            const uploadOptions = {
                binary: commandParameters.arguments.binary,
                maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                task: status,
                responseTimeout: commandParameters.arguments.responseTimeout,
                includeHidden: commandParameters.arguments.includeHidden
            };
            const attributes = zos_files_for_zowe_sdk_1.ZosFilesAttributes.loadFromFile(commandParameters.arguments.attributes, inputDir);
            if (attributes != null) {
                uploadOptions.attributes = attributes;
            }
            else {
                uploadOptions.filesMap = this.buildFilesMap(commandParameters);
            }
            const uploadApi = commandParameters.arguments.recursive ? zos_files_for_zowe_sdk_1.Upload.dirToUSSDirRecursive : zos_files_for_zowe_sdk_1.Upload.dirToUSSDir;
            const response = yield uploadApi.bind(zos_files_for_zowe_sdk_1.Upload)(session, inputDir, commandParameters.arguments.USSDir, uploadOptions);
            const formatMessage = imperative_1.TextUtils.prettyJson(response.apiResponse);
            commandParameters.response.console.log(formatMessage);
            return response;
        });
    }
    buildFilesMap(commandParameters) {
        let filesMap = null;
        // checking if binary-files or ascii-files are used, and update filesMap argument
        if (commandParameters.arguments.binaryFiles) {
            filesMap = {
                binary: true,
                fileNames: commandParameters.arguments.binaryFiles.split(",").map((fileName) => fileName.trim())
            };
        }
        if (commandParameters.arguments.asciiFiles) {
            filesMap = {
                binary: false,
                fileNames: commandParameters.arguments.asciiFiles.split(",").map((fileName) => fileName.trim())
            };
        }
        return filesMap;
    }
}
exports.default = DirToUSSDirHandler;
//# sourceMappingURL=DirToUSSDir.handler.js.map