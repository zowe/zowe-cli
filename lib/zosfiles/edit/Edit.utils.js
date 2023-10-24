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
exports.EditUtilities = exports.Prompt = void 0;
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const imperative_1 = require("@zowe/imperative");
const CompareBaseHelper_1 = require("../compare/CompareBaseHelper");
const fs_1 = require("fs");
const os_1 = require("os");
const path = require("path");
const LocalfileDataset_handler_1 = require("../compare/lf-ds/LocalfileDataset.handler");
const LocalfileUss_handler_1 = require("../compare/lf-uss/LocalfileUss.handler");
/**
 * enum of prompts to be used as input to {@link EditUtilities.promptUser} during the file editing process
 * @export
 * @enum
 */
var Prompt;
(function (Prompt) {
    Prompt[Prompt["useStash"] = 0] = "useStash";
    Prompt[Prompt["viewDiff"] = 1] = "viewDiff";
    Prompt[Prompt["overwriteRemote"] = 2] = "overwriteRemote";
    Prompt[Prompt["viewUpdatedRemote"] = 3] = "viewUpdatedRemote";
    Prompt[Prompt["continueToUpload"] = 4] = "continueToUpload";
})(Prompt = exports.Prompt || (exports.Prompt = {}));
/**
 * A shared utility class that uss and ds handlers use for local file editing
 * @export
 * @class
 */
class EditUtilities {
    /**
     * Builds a temp path where local file will be saved. If uss file, file name will be hashed
     * to prevent any conflicts with file naming. A given filename will always result in the
     * same unique file path.
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @returns {Promise<string>} - returns unique file path for temp file
     * @memberof EditUtilities
     */
    static buildTempPath(lfFile, commandParameters) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // find the appropriate extension for either uss or ds
            const ussExt = (lfFile.fileType === 'uss' && lfFile.fileName.includes(".")) ? lfFile.fileName.split(".").pop() : "";
            let ext = "." + (lfFile.fileType === 'uss' ? ussExt : ((_a = commandParameters.arguments.extension) !== null && _a !== void 0 ? _a : "txt"));
            ext = (ext === "." ? "" : ext);
            if (lfFile.fileType === 'uss') {
                // Hash in a repeatable way if uss fileName (in case presence of special chars)
                const crypto = require("crypto");
                let hash = crypto.createHash('sha256').update(lfFile.fileName).digest('hex');
                // shorten hash
                const hashLen = 10;
                hash = hash.slice(0, hashLen);
                return path.join((0, os_1.tmpdir)(), path.parse(lfFile.fileName).name + '_' + hash + ext);
            }
            return path.join((0, os_1.tmpdir)(), lfFile.fileName + ext);
        });
    }
    /**
     * Check for temp path's existence (check if previously 'stashed'/temp edits exist)
     * @param {string} tempPath - unique file path for local file (stash/temp file)
     * @returns {Promise<boolean>} - promise that resolves to true if stash exists or false if doesn't
     * @memberof EditUtilities
     */
    static checkForStash(tempPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, fs_1.existsSync)(tempPath);
            }
            catch (err) {
                throw new imperative_1.ImperativeError({
                    msg: 'Failure when checking for stash. Command terminated.',
                    causeErrors: err
                });
            }
        });
    }
    /**
     * Collection of prompts to be used at different points in editing process
     * @param {Prompt} prompt - selected prompt from {@link Prompt} (enum object)
     * @param {Boolean} conflict - optional. true if detected conflict between local and remote files
     * @returns {Promise<boolean>} - promise whose resolution depends on user input
     * @memberof EditUtilities
     */
    static promptUser(prompt, conflict) {
        return __awaiter(this, void 0, void 0, function* () {
            let input;
            let promptText;
            const promptPrefix = (conflict ? 'CONFLICT: ' : '');
            switch (prompt) {
                case Prompt.useStash:
                    promptText = 'Keep and continue editing found temp file? y/n';
                    break;
                case Prompt.viewDiff:
                    promptText = 'View diff between temp and mainframe files? y/n';
                    break;
                case Prompt.viewUpdatedRemote:
                    promptText = promptPrefix + 'Remote has changed. View diff between local and mainframe files? y/n';
                    break;
                case Prompt.overwriteRemote:
                    promptText = promptPrefix + 'Overwrite remote with local edits? (Answer after editing) y/n';
                    break;
                case Prompt.continueToUpload:
                    promptText = promptPrefix + 'Ignore conflicts and overwrite remote? y/n';
                    break;
            }
            do {
                input = yield imperative_1.CliUtils.readPrompt(imperative_1.TextUtils.chalk.green(promptText));
            } while (input != null && input.toLowerCase() != 'y' && input.toLowerCase() != 'n');
            if (input == null) {
                throw new imperative_1.ImperativeError({
                    msg: imperative_1.TextUtils.chalk.red('No input provided. Command terminated. Temp file will persist.')
                });
            }
            return input.toLowerCase() === 'y';
        });
    }
    /**
     * Download file and determine if downloading just to get etag (useStash) or to save file locally & get etag (!useStash)
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @param {boolean} useStash - should be true if don't want to overwrite local file when refreshing etag
     * @returns {ILocalFile}
     */
    static localDownload(session, lfFile, useStash) {
        return __awaiter(this, void 0, void 0, function* () {
            // account for both useStash|!useStash and uss|ds when downloading
            const tempPath = useStash ? path.posix.join((0, os_1.tmpdir)(), "toDelete.txt") : lfFile.tempPath;
            const args = [
                session,
                lfFile.fileName,
                {
                    returnEtag: true,
                    binary: null,
                    encoding: null,
                    file: tempPath
                }
            ];
            if (lfFile.fileType === 'uss') {
                lfFile.zosResp = yield zos_files_for_zowe_sdk_1.Download.ussFile(...args);
                lfFile.encoding = args[2].encoding;
            }
            else {
                lfFile.zosResp = yield zos_files_for_zowe_sdk_1.Download.dataSet(...args);
            }
            if (useStash) {
                yield this.destroyTempFile(path.posix.join((0, os_1.tmpdir)(), "toDelete.txt"));
            }
            return lfFile;
        });
    }
    /**
     * Performs appropriate file comparison (either in browser or as a terminal diff) between local file and remote
     * Local file (lf) will then be opened in default editor
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @param {boolean} promptUser - optional. if there are changes then prompt user to show diff, otherwise return
     * @returns {Promise<IZosFilesResponse>} - the response generated by {@link CompareBaseHelper.getResponse}
     * @memberof EditUtilities
     */
    static fileComparison(session, commandParameters, lfFile, promptUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const handlerDs = new LocalfileDataset_handler_1.default();
            const handlerUss = new LocalfileUss_handler_1.default();
            const helper = new CompareBaseHelper_1.CompareBaseHelper(commandParameters);
            const gui = imperative_1.ProcessUtils.isGuiAvailable();
            const options = {
                name1: "local file",
                name2: "remote file"
            };
            helper.browserView = (gui === imperative_1.GuiResult.GUI_AVAILABLE);
            const lf = yield handlerDs.getFile1(session, commandParameters.arguments, helper);
            let mf;
            try {
                if (commandParameters.positionals[2].includes('d')) {
                    mf = yield handlerDs.getFile2(session, commandParameters.arguments, helper);
                }
                else {
                    mf = yield handlerUss.getFile2(session, commandParameters.arguments, helper);
                }
            }
            catch (err) {
                throw new imperative_1.ImperativeError({
                    msg: imperative_1.TextUtils.chalk.red(err + '\nCommand terminated. Issue retrieving files for comparison.'),
                    causeErrors: err
                });
            }
            const localContent = helper.prepareContent(lf);
            const remoteContent = helper.prepareContent(mf);
            let viewUpdatedRemote = !promptUser;
            if (localContent !== remoteContent) {
                lfFile.conflict = true;
            }
            if (promptUser && lfFile.conflict) {
                viewUpdatedRemote = yield this.promptUser(Prompt.viewUpdatedRemote, lfFile.conflict);
            }
            if (!viewUpdatedRemote) {
                return;
            }
            const diffResponse = yield helper.getResponse(localContent, remoteContent, options);
            if (!helper.browserView) {
                if (diffResponse) {
                    commandParameters.response.console.log('\n' + diffResponse.commandResponse);
                }
                else {
                    throw new imperative_1.ImperativeError({
                        msg: imperative_1.TextUtils.chalk.red('Diff was unable to be generated')
                    });
                }
            }
            return diffResponse;
        });
    }
    /**
     * Enable user to make their edits and wait for user input to indicate editing is complete
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @param {string} editor - optional parameter originally supplied by args
     * @memberof EditUtilities
     */
    static makeEdits(lfFile, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lfFile.guiAvail) {
                imperative_1.ProcessUtils.openInEditor(lfFile.tempPath, editor, true);
            }
            return yield this.promptUser(Prompt.overwriteRemote, lfFile.conflict);
        });
    }
    /**
     * Upload temp file with saved etag
     *  - if matching etag: successful upload, destroy stash/temp -> END
     *  - if non-matching etag: unsuccessful upload -> refresh etag -> perform file comparison/edit -> re-attempt upload
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @returns {Promise<[boolean, boolean]>} - [resolves to true if uploading was successful and
     * false if not, resolves to true if user wishes to cancel command and false if not]
     * @memberof EditUtilities
     */
    static uploadEdits(session, commandParameters, lfFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const etagMismatchCode = 412;
            const args = [
                session,
                lfFile.tempPath,
                lfFile.fileName,
                {
                    encoding: lfFile.encoding,
                    etag: lfFile.zosResp.apiResponse.etag,
                    returnEtag: true
                },
            ];
            let response;
            try {
                if (lfFile.fileType === 'uss') {
                    response = yield zos_files_for_zowe_sdk_1.Upload.fileToUssFile(...args);
                }
                else {
                    response = yield zos_files_for_zowe_sdk_1.Upload.fileToDataset(...args);
                }
                if (response.success) {
                    // If matching etag & successful upload, destroy temp file -> END
                    yield this.destroyTempFile(lfFile.tempPath);
                    return [true, false];
                }
                else {
                    if (response.commandResponse.includes('412')) {
                        return yield this.etagMismatch(session, commandParameters, lfFile);
                        //returns [uploaded, canceled]
                    }
                }
            }
            catch (err) {
                if (err.errorCode && err.errorCode == etagMismatchCode) {
                    return yield this.etagMismatch(session, commandParameters, lfFile);
                }
            }
            throw new imperative_1.ImperativeError({
                msg: imperative_1.TextUtils.chalk.red((response === null || response === void 0 ? void 0 : response.errorMessage) +
                    'Command terminated. Issue uploading stash. Temp file will persist'),
                causeErrors: response === null || response === void 0 ? void 0 : response.errorMessage
            });
        });
    }
    /**
     * When changes occur in the remote file, user will have to overwrite remote or account for the discrepancy between files
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @returns {Promise<boolean>} - returns a boolean where true means command is canceled and false means continue
     * @memberof EditUtilities
     */
    static etagMismatch(session, commandParameters, lfFile) {
        return __awaiter(this, void 0, void 0, function* () {
            lfFile.conflict = true;
            try {
                //alert user that the version of document they've been editing has changed
                //ask if they want to see changes on the remote file before continuing
                const viewUpdatedRemote = yield this.promptUser(Prompt.viewUpdatedRemote, lfFile.conflict);
                if (viewUpdatedRemote) {
                    yield this.fileComparison(session, commandParameters, lfFile);
                }
                //ask if they want to keep editing or upload despite changes to remote
                const continueToUpload = yield this.promptUser(Prompt.continueToUpload, lfFile.conflict);
                // refresh etag, keep stash
                yield this.localDownload(session, lfFile, true);
                if (!continueToUpload) {
                    // create more edits & open stash/lf in editor
                    const readyToUpload = yield this.makeEdits(lfFile, commandParameters.arguments.editor);
                    if (readyToUpload) {
                        return yield EditUtilities.uploadEdits(session, commandParameters, lfFile);
                    }
                    else {
                        return [false, true]; //[uploaded, canceled]
                    }
                }
                return [false, false]; //[uploaded, canceled]
            }
            catch (err) {
                throw new imperative_1.ImperativeError({
                    msg: imperative_1.TextUtils.chalk.red('Command terminated. Issue with etag. Temp file will persist.'),
                    causeErrors: err
                });
            }
        });
    }
    /**
     * Destroy path of temporary local file (remove stash)
     * @param {string} tempPath - unique file path for local file (stash)
     * @memberof EditUtilities
     */
    static destroyTempFile(tempPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, fs_1.unlinkSync)(tempPath);
            }
            catch (err) {
                throw new imperative_1.ImperativeError({
                    msg: 'Temporary file could not be deleted: ${tempPath}',
                    causeErrors: err
                });
            }
        });
    }
}
exports.EditUtilities = EditUtilities;
//# sourceMappingURL=Edit.utils.js.map