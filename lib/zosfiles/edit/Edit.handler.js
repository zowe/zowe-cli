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
const ZosFilesBase_handler_1 = require("../ZosFilesBase.handler");
const Edit_utils_1 = require("../edit/Edit.utils");
/**
 * Handler to Edit USS or DS content locally
 * @export
 */
class EditHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Setup - build temp and check for stash
            let lfFile = {
                tempPath: null,
                fileName: (_a = commandParameters.arguments.ussFilePath) !== null && _a !== void 0 ? _a : commandParameters.arguments.dataSetName,
                fileType: commandParameters.positionals[2].includes('d') ? "ds" : "uss",
                guiAvail: imperative_1.ProcessUtils.isGuiAvailable() === imperative_1.GuiResult.GUI_AVAILABLE,
                conflict: false,
                zosResp: null
            };
            lfFile.tempPath = commandParameters.arguments.localFilePath = yield Edit_utils_1.EditUtilities.buildTempPath(lfFile, commandParameters);
            // Use or override stash if exists
            const stash = yield Edit_utils_1.EditUtilities.checkForStash(lfFile.tempPath);
            let useStash, viewDiff = false;
            if (stash) {
                useStash = yield Edit_utils_1.EditUtilities.promptUser(Edit_utils_1.Prompt.useStash);
            }
            // Retrieve etag & download mf file to edit locally if not using stash
            try {
                const task = {
                    percentComplete: 10,
                    statusMessage: "Retrieving file",
                    stageName: imperative_1.TaskStage.IN_PROGRESS
                };
                commandParameters.response.progress.startBar({ task });
                // Retrieve etag AND file contents if not using stash
                lfFile = yield Edit_utils_1.EditUtilities.localDownload(session, lfFile, useStash);
                commandParameters.response.progress.endBar();
                // Show a file comparison for the purpose of seeing the current version of remote compared to past edits
                if (useStash) {
                    viewDiff = yield Edit_utils_1.EditUtilities.promptUser(Edit_utils_1.Prompt.viewDiff);
                    if (viewDiff) {
                        yield Edit_utils_1.EditUtilities.fileComparison(session, commandParameters, lfFile);
                    }
                }
            }
            catch (error) {
                if (error instanceof imperative_1.ImperativeError && error.errorCode === String(imperative_1.RestConstants.HTTP_STATUS_404)) {
                    throw new imperative_1.ImperativeError({
                        msg: imperative_1.TextUtils.chalk.red(`File not found on mainframe. Command terminated.`),
                        causeErrors: error
                    });
                }
                else {
                    throw error;
                }
            }
            // Edit local copy of mf file (automatically open an editor for user if not in headless linux)
            commandParameters.response.console.log(imperative_1.TextUtils.chalk.green(`Temp file location: `) +
                imperative_1.TextUtils.chalk.blue(lfFile.tempPath));
            const overwrite = yield Edit_utils_1.EditUtilities.makeEdits(lfFile, commandParameters.arguments.editor);
            if (!overwrite) {
                return {
                    success: true,
                    commandResponse: imperative_1.TextUtils.chalk.green("Exiting now. Temp file persists for editing.")
                };
            }
            // Once done editing, user will provide terminal input. Upload local file with saved etag
            let uploaded = false;
            let canceled = false;
            do {
                [uploaded, canceled] = yield Edit_utils_1.EditUtilities.uploadEdits(session, commandParameters, lfFile);
            } while (!uploaded && !canceled);
            if (!canceled) {
                return {
                    success: true,
                    commandResponse: imperative_1.TextUtils.chalk.green("Successfully uploaded edits to mainframe.")
                };
            }
            else {
                return {
                    success: true,
                    commandResponse: imperative_1.TextUtils.chalk.green("Exiting now. Temp file persists for editing.")
                };
            }
        });
    }
}
exports.default = EditHandler;
//# sourceMappingURL=Edit.handler.js.map