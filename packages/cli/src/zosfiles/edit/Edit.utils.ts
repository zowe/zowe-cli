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
import path = require("path");
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import LocalfileUssHandler from "../compare/lf-uss/LocalfileUss.handler";


/**
 * enum of prompts to be used as input to {@link EditUtilities.promptUser} during the file editing process
 * @export
 * @enum
 */
export enum Prompt {
    useStash,
    doneEditing,
    continueToUpload,
    viewUpdatedRemote
}

/**
 * The possible types of file {@link ILocalFile}
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
    encoding?: string | null;
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
        // find the appropriate extension for either uss or ds in two (long) operations
        const ussExt = (lfFile.fileType === 'uss' && lfFile.fileName.includes(".")) ? lfFile.fileName.split(".").pop() : "";
        const ext = "."  + (lfFile.fileType === 'uss' ? ussExt : (commandParameters.arguments.extension ?? "txt"));
        if (lfFile.fileType === 'uss'){
            // Hash in a repeatable way if uss fileName (incase there are special characters in name)
            const crypto = require("crypto");
            const hash = crypto.createHash('sha256').update(lfFile.fileName).digest('hex');

            return path.join(tmpdir(), hash + ext);
        }
        return path.join(tmpdir(), lfFile.fileName + ext);
    }

    /**
     * Check for temp path's existence (check if previously `stashed` edits exist)
     * @param {string} tempPath - unique file path for local file (stash/temp file)
     * @returns {Promise<boolean>} - promise that resolves to true if stash exists or false if doesn't
     * @memberof EditUtilities
     */
    public static async checkForStash(tempPath: string): Promise<boolean>{
        try {
            return existsSync(tempPath);
        } catch(err) {
            throw new ImperativeError({
                msg: `Failure when checking for stash. Command terminated.`,
                causeErrors: err
            });
        }
    }

    /**
     * Collection of prompts to be used at different points in editing process
     * @param {Prompt} prompt - selected prompt from {@link Prompt} (enum object)
     * @param {string} tempPath - unique file path for local file (stash/temp file)
     * @returns {Promise<boolean>} - promise that resolves depending on prompt case and user input
     * @memberof EditUtilities
     */
    public static async promptUser(prompt: Prompt, tempPath?: string): Promise<boolean>{
        let input;
        switch (prompt){
            case Prompt.useStash:
                do {
                    input = await CliUtils.readPrompt(TextUtils.chalk.green(`Keep and continue editing found local copy? y/n`));
                }
                while (input === '');
                if (input === null) {
                    throw new ImperativeError({
                        msg: `No input provided. Command terminated.`
                    });
                }
                return input.toLowerCase() === 'y';
            case Prompt.doneEditing:
                do{
                    input = await CliUtils.readPrompt(TextUtils.chalk.green(`Downloaded to temporary file: ${tempPath}\n`+
                    `Enter "done" in terminal once finished editing and saving:`), {secToWait: 3600});
                }while(input && input.toLowerCase() !== 'done');{
                    if (input === null) {
                        throw new ImperativeError({
                            msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                        });
                    }
                    return true;
                }
            case Prompt.continueToUpload:
                do {
                    input = await CliUtils.readPrompt(TextUtils.chalk.green(`Continue uploading edits despite changes on remote? y/n`));
                }
                while (input === '');
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                    });
                }
                return input.toLowerCase() === 'y';
            case Prompt.viewUpdatedRemote:
                do {
                    input = await CliUtils.readPrompt(TextUtils.chalk.green(`The remote version of the document you were editing has changed. `+
                    `View the updated version of the mainframe file before proceeding with edits? y/n`));
                }
                while (input === '');
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                    });
                }
                return input.toLowerCase() === 'y';
        }
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
                binary: null,
                encoding: null,
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
     * Performs appropriate file comparison (either in browser or as a terminal diff) between lf-USS or lf-DS.
     * Local file (lf) will then be opened in default editor
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @returns {Promise<IZosFilesResponse>} - the response generated by {@link CompareBaseHelper.getResponse}
     * @memberof EditUtilities
     */
    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters): Promise<IZosFilesResponse>{
        const handlerDs = new LocalfileDatasetHandler;
        const handlerUss = new LocalfileUssHandler;
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
                msg: TextUtils.chalk.red(`Command terminated. Issue retrieving files for comparison.`),
                causeErrors: err
            });
        }

        const diffResponse = await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mf), options);
        if (!helper.browserView){
            if (diffResponse){
                commandParameters.response.console.log('\n'+diffResponse.commandResponse);
            }else{
                throw new ImperativeError({
                    msg: TextUtils.chalk.red(`Diff was unable to be generated`)
                });
            }
        }
        return diffResponse;
    }

    /**
     * Enable user to make their edits and wait for user input to indicate editing is complete
     * @param {string} tempPath - parameters supplied by args
     * @param {string} editor - optional parameter originally supplied by args
     * @memberof EditUtilities
     */
    public static async makeEdits(tempPath: string, editor?: string): Promise<void>{
        await ProcessUtils.openInEditor(tempPath, editor, true);
    }

    /**
     * Upload temp file with saved etag.
     *  - if matching etag: successful upload, destroy stash/temp -> END
     *  - if non-matching etag: unsuccessful upload -> refresh etag -> perform file comparison/edit -> reattempt upload
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @returns {Promise<boolean>} - promise that resolves to true if uploading was successful and
     * false if user needs to take more action before completing the upload
     * @memberof EditUtilities
     */
    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters,
        lfFile: ILocalFile): Promise<boolean>{
        const etagMismatchCode = 412;
        const args: [AbstractSession, string, string, IUploadOptions] = [
            session,
            lfFile.tempPath,
            lfFile.fileName,
            {
                encoding: lfFile.encoding,
                etag: lfFile.zosResp.apiResponse.etag
            }
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
                return true;
            } else {
                if (response.commandResponse.includes('412')){
                    await this.etagMismatch(session, commandParameters, lfFile);
                    return false;
                }
            }
        }catch(err){
            if (err.errorCode && err.errorCode == etagMismatchCode){
                await this.etagMismatch(session, commandParameters, lfFile);
                return false;
            }
        }
        throw new ImperativeError({
            msg: TextUtils.chalk.red(`Command terminated. Issue uploading stash. Stashed file will persist: ${lfFile.tempPath}`),
            causeErrors: response?.errorMessage
        });
    }

    /**
     * When changes occur in the remote file, user will have to decide to overwrite stash or to account for the discrepancy between files
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {ILocalFile} lfFile - object containing pertinent information about the local file during the editing process
     * @memberof EditUtilities
     */
    public static async etagMismatch(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: ILocalFile): Promise<void>{
        const tempPath = lfFile.tempPath;
        try{
            //alert user that the version of document they've been editing has changed
            //ask if they want to see changes on the remote file before continuing
            const viewUpdatedRemote: boolean = await this.promptUser(Prompt.viewUpdatedRemote);
            if (viewUpdatedRemote){
                await this.fileComparison(session, commandParameters);
            }
            //ask if they want to keep working with their stash (local file) or upload despite changes to remote
            const continueToUpload: boolean = await this.promptUser(Prompt.continueToUpload, tempPath);
            // refresh etag, keep stash
            await this.localDownload(session, lfFile, true);
            if (!continueToUpload){
                // create more edits & open stash/lf in editor
                await this.makeEdits(tempPath, commandParameters.arguments.editor);
            }
        }catch(err){
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`Command terminated. Issue with etag. Stashed file will persist: ${tempPath}`),
                causeErrors: err
            });
        }
    }

    /**
     * Destroy local file path (remove stash)
     * @param {string} tempPath - unique file path for local file (stash)
     * @memberof EditUtilities
     */
    public static async destroyTempFile(tempPath:string): Promise<void>{
        try {
            unlinkSync(tempPath);
        } catch (err) {
            throw new ImperativeError({
                msg: `Temporary file could not be deleted: ${tempPath}`,
                causeErrors: err
            });
        }
    }
}
