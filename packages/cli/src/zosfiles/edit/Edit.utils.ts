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

import { Download, Upload, IZosFilesResponse, IDownloadOptions, IUploadOptions } from "@zowe/zos-files-for-zowe-sdk";
import { AbstractSession, IHandlerParameters, ImperativeError, ProcessUtils, GuiResult,
    TextUtils, IDiffNameOptions, CliUtils } from "@zowe/imperative";
import { CompareBaseHelper } from "../compare/CompareBaseHelper";
import { existsSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import LocalfileUssHandler from "../compare/lf-uss/LocalfileUss.handler";


/**
 * enum of prompts to be used as input to {@link EditUtilities.promptUser} during the file editing process
 * @export
 * @enum
 */
export enum Prompt {
    useStash,
    viewDiff,
    overwriteRemote,
    viewUpdatedRemote,
    continueToUpload
}

/**
 * Type indicates which file system is being used for storage on mainframe {@link ILocalFile}
 * @export
 * @type
 */
export type EditFileType = "uss" | "ds";

/**
 * A class to hold pertinent information about the local file during the editing process
 * @export
 * @interface
 */
export interface ILocalFile {
    tempPath: string | null;
    fileName: string;
    fileType: EditFileType;
    guiAvail: boolean;
    zosResp: IZosFilesResponse | null;
    conflict: boolean;
    encoding?: string | null;
    binary?: boolean;
}

/**
 * A shared utility class that uss and ds handlers use for local file editing
 * @export
 * @class
 */
export class EditUtilities {
    /**
     * Builds a temp path where local file will be saved. If uss file, file name will be hashed
     * to prevent any conflicts with file naming. A given filename will always result in the
     * same unique file path.
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @returns {Promise<string>} - returns unique file path for temp file
     * @memberof EditUtilities
     */
    public static async buildTempPath(lfFile: ILocalFile, commandParameters: IHandlerParameters): Promise<string>{
        // find the appropriate extension for either uss or ds
        const ussExt = (lfFile.fileType === 'uss' && lfFile.fileName.includes(".")) ? lfFile.fileName.split(".").pop() : "";
        let ext = "."  + (lfFile.fileType === 'uss' ? ussExt : (commandParameters.arguments.extension ?? "txt"));
        ext = (ext === "." ? "" : ext);
        if (lfFile.fileType === 'uss'){
            // Hash in a repeatable way if uss fileName (in case presence of special chars)
            const crypto = require("crypto");
            let hash = crypto.createHash('sha256').update(lfFile.fileName).digest('hex');
            // shorten hash
            const hashLen = 10;
            hash = hash.slice(0, hashLen);
            return path.join(tmpdir(), path.parse(lfFile.fileName).name + '_' + hash + ext);
        }
        return path.join(tmpdir(), lfFile.fileName + ext);
    }

    /**
     * Check for temp path's existence (check if previously 'stashed'/temp edits exist)
     * @param {string} tempPath - unique file path for local file (stash/temp file)
     * @returns {Promise<boolean>} - promise that resolves to true if stash exists or false if doesn't
     * @memberof EditUtilities
     */
    public static async checkForStash(tempPath: string): Promise<boolean>{
        try {
            return existsSync(tempPath);
        } catch(err) {
            throw new ImperativeError({
                msg: 'Failure when checking for stash. Command terminated.',
                causeErrors: err
            });
        }
    }

    /**
     * Collection of prompts to be used at different points in editing process
     * @param {Prompt} prompt - selected prompt from {@link Prompt} (enum object)
     * @param {Boolean} conflict - optional. true if detected conflict between local and remote files
     * @returns {Promise<boolean>} - promise whose resolution depends on user input
     * @memberof EditUtilities
     */
    public static async promptUser(prompt: Prompt, conflict?: boolean): Promise<boolean>{
        let input;
        let promptText;
        const promptPrefix = (conflict ? 'CONFLICT: ' : '');
        switch (prompt){
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
            input = await CliUtils.readPrompt(TextUtils.chalk.green(promptText));
        }
        while (input != null && input.toLowerCase() != 'y' &&  input.toLowerCase() != 'n');
        if (input == null) {
            throw new ImperativeError({
                msg: TextUtils.chalk.red('No input provided. Command terminated. Temp file will persist.')
            });
        }
        return input.toLowerCase() === 'y';
    }

    /**
     * Download file and determine if downloading just to get etag (useStash) or to save file locally & get etag (!useStash)
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @param {boolean} useStash - should be true if don't want to overwrite local file when refreshing etag
     * @returns {ILocalFile}
     */
    public static async localDownload(session: AbstractSession, lfFile: ILocalFile, useStash: boolean): Promise<ILocalFile>{
        // account for both useStash|!useStash and uss|ds when downloading
        const tempPath = useStash ? path.posix.join(tmpdir(), "toDelete.txt") : lfFile.tempPath;
        const args: [AbstractSession, string, IDownloadOptions] = [
            session,
            lfFile.fileName,
            {
                returnEtag: true,
                binary: lfFile.binary,
                encoding: lfFile.encoding,
                file: tempPath
            }
        ];

        if(lfFile.fileType === 'uss'){
            lfFile.zosResp = await Download.ussFile(...args);
            lfFile.encoding = args[2].encoding;
        }else{
            lfFile.zosResp = await Download.dataSet(...args);
        }

        if (useStash){
            await this.destroyTempFile(path.posix.join(tmpdir(), "toDelete.txt"));
        }
        return lfFile;
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
    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: ILocalFile,
        promptUser?: boolean): Promise<IZosFilesResponse>{
        const handlerDs = new LocalfileDatasetHandler();
        const handlerUss = new LocalfileUssHandler();
        const helper = new CompareBaseHelper(commandParameters);
        const gui = ProcessUtils.isGuiAvailable();
        const options: IDiffNameOptions = {
            name1: "local file",
            name2: "remote file"
        };

        helper.browserView = (gui === GuiResult.GUI_AVAILABLE);

        const lf: Buffer = await handlerDs.getFile1(session, commandParameters.arguments, helper);
        let mf: string | Buffer;
        try{
            if (commandParameters.positionals[2].includes('d')){
                mf = await handlerDs.getFile2(session, commandParameters.arguments, helper);
            }else{
                mf = await handlerUss.getFile2(session, commandParameters.arguments, helper);
            }
        }catch(err){
            throw new ImperativeError({
                msg: TextUtils.chalk.red(err+'\nCommand terminated. Issue retrieving files for comparison.'),
                causeErrors: err
            });
        }

        const localContent = helper.prepareContent(lf);
        const remoteContent = helper.prepareContent(mf);
        let viewUpdatedRemote = !promptUser;
        if (localContent !== remoteContent){
            lfFile.conflict = true;
        }
        if (promptUser && lfFile.conflict) {
            viewUpdatedRemote = await this.promptUser(Prompt.viewUpdatedRemote, lfFile.conflict);
        }
        if (!viewUpdatedRemote) {
            return;
        }
        const diffResponse = await helper.getResponse(localContent, remoteContent, options);
        if (!helper.browserView){
            if (diffResponse){
                commandParameters.response.console.log('\n'+diffResponse.commandResponse);
            }else{
                throw new ImperativeError({
                    msg: TextUtils.chalk.red('Diff was unable to be generated')
                });
            }
        }
        return diffResponse;
    }

    /**
     * Enable user to make their edits and wait for user input to indicate editing is complete
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @param {string} editor - optional parameter originally supplied by args
     * @memberof EditUtilities
     */
    public static async makeEdits(lfFile: ILocalFile, editor?: string): Promise<boolean>{
        if (lfFile.guiAvail){
            ProcessUtils.openInEditor(lfFile.tempPath, editor, true);
        }
        return await this.promptUser(Prompt.overwriteRemote, lfFile.conflict);
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
    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters,
        lfFile: ILocalFile): Promise<[boolean, boolean]>{
        const etagMismatchCode = 412;
        const args: [AbstractSession, string, string, IUploadOptions] = [
            session,
            lfFile.tempPath,
            lfFile.fileName,
            {
                encoding: lfFile.encoding,
                etag: lfFile.zosResp.apiResponse.etag,
                returnEtag: true
            },
        ];
        let response: IZosFilesResponse;

        try{
            if (lfFile.fileType === 'uss'){
                response = await Upload.fileToUssFile(...args);
            }else{
                response = await Upload.fileToDataset(...args);
            }
            if (response.success){
                // If matching etag & successful upload, destroy temp file -> END
                await this.destroyTempFile(lfFile.tempPath);
                return [true, false];
            } else {
                if (response.commandResponse.includes('412')){
                    return await this.etagMismatch(session, commandParameters, lfFile);
                    //returns [uploaded, canceled]
                }
            }
        }catch(err){
            if (err.errorCode && err.errorCode == etagMismatchCode){
                return await this.etagMismatch(session, commandParameters, lfFile);
            }
        }
        throw new ImperativeError({
            msg: TextUtils.chalk.red(response?.errorMessage +
                'Command terminated. Issue uploading stash. Temp file will persist'),
            causeErrors: response?.errorMessage
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
    public static async etagMismatch(session: AbstractSession, commandParameters: IHandlerParameters,
        lfFile: ILocalFile): Promise<[boolean, boolean]>{
        lfFile.conflict = true;
        try{
            //alert user that the version of document they've been editing has changed
            //ask if they want to see changes on the remote file before continuing
            const viewUpdatedRemote: boolean = await this.promptUser(Prompt.viewUpdatedRemote, lfFile.conflict);
            if (viewUpdatedRemote){
                await this.fileComparison(session, commandParameters, lfFile);
            }
            //ask if they want to keep editing or upload despite changes to remote
            const continueToUpload: boolean = await this.promptUser(Prompt.continueToUpload, lfFile.conflict);
            // refresh etag, keep stash
            await this.localDownload(session, lfFile, true);
            if (!continueToUpload){
                // create more edits & open stash/lf in editor
                const readyToUpload = await this.makeEdits(lfFile, commandParameters.arguments.editor);
                if (readyToUpload){
                    return await EditUtilities.uploadEdits(session, commandParameters, lfFile);
                }else{
                    return [false, true]; //[uploaded, canceled]
                }
            }
            return [false, false]; //[uploaded, canceled]
        }catch(err){
            throw new ImperativeError({
                msg: TextUtils.chalk.red('Command terminated. Issue with etag. Temp file will persist.'),
                causeErrors: err
            });
        }
    }

    /**
     * Destroy path of temporary local file (remove stash)
     * @param {string} tempPath - unique file path for local file (stash)
     * @memberof EditUtilities
     */
    public static async destroyTempFile(tempPath:string): Promise<void>{
        try {
            unlinkSync(tempPath);
        } catch (err) {
            throw new ImperativeError({
                msg: 'Temporary file could not be deleted: ${tempPath}',
                causeErrors: err
            });
        }
    }
}