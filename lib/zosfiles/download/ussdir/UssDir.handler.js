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
class UssDirHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const downloadStatus = {
                statusMessage: "Searching for files",
                percentComplete: 0,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            const zosAttributes = zos_files_for_zowe_sdk_1.ZosFilesAttributes.loadFromFile(commandParameters.arguments.attributes, commandParameters.arguments.directory);
            const downloadOptions = {
                binary: commandParameters.arguments.binary,
                directory: commandParameters.arguments.directory,
                maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                task: downloadStatus,
                responseTimeout: commandParameters.arguments.responseTimeout,
                failFast: commandParameters.arguments.failFast,
                attributes: zosAttributes,
                includeHidden: commandParameters.arguments.includeHidden,
                overwrite: commandParameters.arguments.overwrite
            };
            const listOptions = {
                name: commandParameters.arguments.name ? commandParameters.arguments.name : "*",
                maxLength: commandParameters.arguments.maxLength,
                group: commandParameters.arguments.group,
                user: commandParameters.arguments.owner,
                mtime: commandParameters.arguments.mtime,
                size: commandParameters.arguments.size,
                perm: commandParameters.arguments.perm,
                type: commandParameters.arguments.type,
                depth: commandParameters.arguments.depth,
                filesys: commandParameters.arguments.filesys,
                symlinks: commandParameters.arguments.symlinks
            };
            commandParameters.response.progress.startBar({ task: downloadStatus });
            const response = yield zos_files_for_zowe_sdk_1.Download.ussDir(session, commandParameters.arguments.ussDirName, downloadOptions, listOptions);
            commandParameters.response.progress.endBar();
            return response;
        });
    }
}
exports.default = UssDirHandler;
//# sourceMappingURL=UssDir.handler.js.map