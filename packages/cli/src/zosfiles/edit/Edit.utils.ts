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

import { AbstractSession, IHandlerParameters, ImperativeError, ProcessUtils, GuiResult,
    TextUtils, IDiffOptions } from "@zowe/imperative";
import { tmpdir } from "os";
import { Download, Upload, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import LocalfileUssHandler from "../compare/lf-uss/LocalfileUss.handler";
import { CompareBaseHelper } from "../compare/CompareBaseHelper";
import { CliUtils } from "@zowe/imperative";
import { existsSync, unlinkSync } from "fs";

export class LocalFile {
    path: string;
    zosResp: IZosFilesResponse;
}
export enum Prompt {
    useStash,
    doneEditing,
    continueToUpload
}

/**
 * A shared utility class that uss and ds handlers use for local file editing.
 * @export
 * @class EditUtilities
 */
export class EditUtilities {
    /**
     * Builds a temp path where local file will be saved. If uss file, file name will be hashed
     * to prevent any conflicts with file naming. A given filename will always result in the
     * same unique file path.
     * @param {IHandlerParameters} commandParameters - parameters supplied by args
     * @returns {Promise<string>} - returns unique file path for temp file
     * @memberof EditUtilities
     */
    public static async buildTempPath(commandParameters: IHandlerParameters): Promise<string>{
        const ext = (commandParameters.arguments.extension ? commandParameters.arguments.extension : ".txt");
        let fileName: string;
        if (commandParameters.positionals.includes('uss')){
            // Hash in a repeatable way if uss fileName (to get around any potential special characters in name)
            fileName = commandParameters.arguments.file;
            const crypto = require("crypto");
            const hash = crypto.createHash('sha256').update(fileName).digest('hex');
            return tmpdir() +"\\" + hash  + "." + ext;
        }else{
            fileName = commandParameters.arguments.dataSetName;
            return tmpdir() + "\\" + fileName + "." + ext;
        }
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
     * @param {tempPath} string - unique file path for temp file
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
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Enter any value in terminal once finished `+
                    `editing and saving temporary file: ${tempPath}`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                    });
                }else{
                    return true;
                }
            case Prompt.continueToUpload:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`The version of the document you were editing has changed.` +
                    `Continue uploading current edits? Y/n\n${tempPath}\n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${tempPath}`)
                    });
                }
                return input.toLowerCase() === 'y';
        }
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
            await ProcessUtils.openInEditor(tempPath, editor);
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
        let response: IZosFilesResponse;
        let fileName;
        try{
            if (commandParameters.positionals.includes('uss')){
                fileName = commandParameters.arguments.file;
                response = await Upload.fileToUssFile(session, lfFile.path, commandParameters.arguments.file,
                    {etag: lfFile.zosResp.apiResponse.etag});
            }else{
                fileName =commandParameters.arguments.dataSetName;
                response = await Upload.fileToDataset(session, lfFile.path, fileName, {etag: lfFile.zosResp.apiResponse.etag});
            }
            if (response.success){
                // If matching etag & successful upload, destroy temp file -> END
                await this.destroyTempFile(lfFile.path);
                return true;
            }
        }catch(err){
            const etagMismatchCode = 412;
            if (err.errorCode && err.errorCode == etagMismatchCode){
                // open a fileComparision
                await this.fileComparison(session, commandParameters);
                //alert user that the version of document they've been editing has changed
                //ask if they want to continue working with their stash (local file)
                const continueToUpload: boolean = await this.promptUser(Prompt.continueToUpload, lfFile.path);
                if (continueToUpload){
                    // Refresh the etag of lfFile (keep stash)
                    if (commandParameters.positionals.includes('uss')){
                        lfFile.zosResp = await Download.ussFile(session, commandParameters.arguments.file,
                            {returnEtag: true, file: tmpdir()+'toDelete'});
                    }
                    else{
                        lfFile.zosResp = await Download.dataSet(session, fileName,
                            {returnEtag: true, file: tmpdir()+'toDelete'});
                    }
                    this.destroyTempFile((tmpdir()+'toDelete'));
                    // upload lf version to mf
                    return false;
                }else{
                    // keep editing lf
                    if (commandParameters.positionals.includes('uss')){
                        lfFile.zosResp = await Download.ussFile(session, commandParameters.arguments.file,
                            {returnEtag: true, file: lfFile.path});
                    }
                    else{
                        lfFile.zosResp = await Download.dataSet(session, fileName,
                            {returnEtag: true, file: lfFile.path});
                    }
                    // open lf in editor
                    await this.makeEdits(commandParameters);
                    return false;
                }
            }
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`Command terminated. Stashed file will persist: ${lfFile.path}`),
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
