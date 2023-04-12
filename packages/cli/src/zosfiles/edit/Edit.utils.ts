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
    TextUtils, IDiffOptions } from "@zowe/imperative";
import { CompareBaseHelper } from "../compare/CompareBaseHelper";
import { CliUtils } from "@zowe/imperative";
import { existsSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import path = require("path");
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import LocalfileUssHandler from "../compare/lf-uss/LocalfileUss.handler";


/**
 * enum of prompts to be used as input to {@link EditUtilities.promptUser} during the file editing process
 * @export
 * @requires EditUtilities.promptUser
 */
export enum Prompt {
    useStash,
    doneEditing,
    continueToUpload,
    viewUpdatedRemote
}

export enum EditFileType {
    uss = 'uss',
    ds = 'ds'
}

/**
 * A class to hold pertinent izosfile response data as well as its downloaded path
 * @export
 */
export class LocalFile {
    tempPath: string;
    fileName: string;
    fileType: EditFileType;
    guiAvail: boolean;
    zosResp: IZosFilesResponse;
}

/**
 * A shared utility class that uss and ds handlers use for local file editing
 * @export
 * @class EditUtilities
 */
export class EditUtilities {
    /**
     * Builds a temp path where local file will be saved. If uss file, file name will be hashed
     * to prevent any conflicts with file naming. A given filename will always result in the
     * same unique file path.
     * @param {LocalFile} lfFile - combined local file, command params, and izosresponse object
     * @returns {Promise<string>} - returns unique file path for temp file
     * @memberof EditUtilities
     */
    public static async buildTempPath(lfFile: LocalFile, commandParameters: IHandlerParameters): Promise<string>{
        const ext = commandParameters.arguments.extension ?? "txt";
        if (lfFile.fileType == 'uss'){
            // Hash in a repeatable way if uss fileName (to get around any potential special characters in name)
            const crypto = require("crypto");
            const hash = crypto.createHash('sha256').update(lfFile.fileName).digest('hex');
            return tmpdir() +"\\" + hash  + "." + ext;
        }
        return tmpdir() + "\\" + lfFile.fileName + "." + ext;
    }

    /**
     * Check for temp path's preexistance (check if previously `stashed` edits exist)
     * @param {string} tempPath - unique file path for temp file
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
     * @param {Prompt} prompt - selected prompt from Prompt (enum object)
     * @param {string} tempPath - unique file path for temp file
     * @returns {Promise<boolean>} - promise that resolves depending on prompt case and user input
     * @memberof EditUtilities
     */
    public static async promptUser(prompt: Prompt, tempPath?: string): Promise<boolean>{
        let input;
        switch (prompt){
            case Prompt.useStash:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Keep and continue editing found stash? Y/n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: `No input provided. Command terminated.`
                    });
                }
                return input.toLowerCase() === 'y';
            case Prompt.doneEditing:
                do{
                    input = await CliUtils.readPrompt(TextUtils.chalk.green(`Enter "done" in terminal once finished `+
                    `editing and saving temporary file: ${tempPath}`));
                }while(input.toLowerCase() !== 'done');{
                    if (input === null) {
                        throw new ImperativeError({
                            msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                        });
                    }
                    return true;
                }
            case Prompt.continueToUpload:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Continue uploading edits despite changes on remote? Y/n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                    });
                }
                return input.toLowerCase() === 'y';
            case Prompt.viewUpdatedRemote:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`The remote version of the document you were editing has changed. `+
                `View the updated version of the mainframe file before proceeding with edits? Y/n`));
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
     * @param session AbstractSession
     * @param commandParameters IHandlerParameters
     * @param lfFile LocalFile
     * @param useStash boolean
     * @returns LocalFile
     */
    public static async localDownload(session: AbstractSession, lfFile: LocalFile, useStash: boolean): Promise<LocalFile>{
        const tempPath = useStash ? path.join(tmpdir(), "toDelete.txt") : lfFile.tempPath;
        const args: [AbstractSession, string, IDownloadOptions] = [
            session,
            lfFile.fileName,
            {
                returnEtag: true,
                file: tempPath
            }
        ];
        // download accounting for both useStash|!useStash and uss|ds
        if(lfFile.fileType === 'uss'){
            lfFile.zosResp = await Download.ussFile(...args);
        }
        lfFile.zosResp = await Download.dataSet(...args);
        //get rid of the fake temp file generated by the useStash case (wouldnt have to do this if the option {overwrite: false} worked)
        if (useStash){
            this.destroyTempFile(path.join(tmpdir(), "toDelete.txt"));
        }
        return lfFile;
    }

    /**
     * Performs appropriate file comparision given comparison is between lf-USS or lf-DS.
     * Local file (lf) will then be opened in default editor if it was set.
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @returns {Promise<IZosFilesResponse>} - the response from the underlying zos-files api call
     * @memberof EditUtilities
     */
    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters): Promise<IZosFilesResponse>{
        const handlerDs = new LocalfileDatasetHandler;
        const handlerUss = new LocalfileUssHandler;
        const helper = new CompareBaseHelper(commandParameters);
        const gui = ProcessUtils.isGuiAvailable();
        const options: IDiffOptions = {
            name1: "local file",
            name2: "mainframe file"
        };

        if(gui === GuiResult.GUI_AVAILABLE){
            helper.browserView = true;
        }

        const lf = await handlerDs.getFile1(session, commandParameters.arguments, helper);
        let mfds: string | Buffer;
        if (commandParameters.positionals.includes('ds')){
            mfds = await handlerDs.getFile2(session, commandParameters.arguments, helper);
        }else{
            mfds = await handlerUss.getFile2(session, commandParameters.arguments, helper);
        }
        // Editor will open with local file if default editor was set
        return await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mfds), options);
    }

    /**
     * Enable user to make their edits by pulling up file diff, opening up lf in editor, and waiting for user input to indicate editing is complete
     * @param {string} tempPath - parameters supplied by args
     * @param {string} editor - OPTIONAL parameter originally supplied by args
     * @memberof EditUtilities
     */
    public static async makeEdits(tempPath: string, editor?: string): Promise<void>{
        if (editor){
            await ProcessUtils.openInEditor(tempPath, editor, true);
        }
        await this.promptUser(Prompt.doneEditing, tempPath);

    }

    /**
     * Upload edits once user input indicating completed edits. Upload temp file with saved etag.
     *if matching etag: sucessful upload, destroy temp file -> END
     * if non-matching etag: unsucessful upload -> perform file comparison/edit again with new etag
     * @param {AbstractSession} session - the session object generated from the connected profile
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @param {LocalFile} lfFile - object containing lf temp path and zosmf response data
     * @returns {Promise<boolean>} - promise that resolves to true if uploading was successful and
     * false if user needs to take more action before completing the upload
     * @memberof EditUtilities
     */
    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters,
        lfFile: LocalFile): Promise<boolean>{
        const etagMismatchCode = 412;
        const args: [AbstractSession, string, string, IUploadOptions] = [
            session,
            lfFile.tempPath,
            lfFile.fileName,
            {
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
            causeErrors: response.errorMessage
        });
    }

    public static async etagMismatch(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: LocalFile): Promise<void>{
        try{
            //alert user that the version of document they've been editing has changed
            //ask if they want to see changes on the remote file they will be overwriting
            const viewUpdatedRemote: boolean = await this.promptUser(Prompt.viewUpdatedRemote);
            if (viewUpdatedRemote){
                await this.fileComparison(session, commandParameters);
            }
            //ask if they want to keep working with their stash (local file) or overwrite & continue to upload
            const continueToUpload: boolean = await this.promptUser(Prompt.continueToUpload, lfFile.tempPath);
            // refresh etag, keep stash
            lfFile = await this.localDownload(session, lfFile, true);
            if (!continueToUpload){
                // create more edits & open stash/lf in editor
                await this.makeEdits(lfFile.tempPath, commandParameters.arguments.editor);
            }
        }catch(err){
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`Command terminated. Issue with etag. Stashed file will persist: ${lfFile.tempPath}`),
                causeErrors: err
            });
        }
    }


    /**
     * Destroy temp file path to remove stash if edits have been successfully uploaded
     * @param {string} tempPath - unique file path for temp file
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
