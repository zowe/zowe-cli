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

import { AbstractSession, IHandlerParameters, ImperativeError, ProcessUtils, GuiResult, TextUtils } from "@zowe/imperative";
import { tmpdir } from "os";
import { Download, Upload, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import { CompareBaseHelper } from "../compare/CompareBaseHelper";
import { CliUtils } from "@zowe/imperative";
import { lowerCase } from "lodash";
import { unlink, existsSync } from "fs";

export enum Prompt {
    useStash,
    doneEditing,
    continueEditing
}
export class EditUtilities {
    // Build tmp path
    public static async buildTmpDir(commandParameters: IHandlerParameters): Promise<string>{
        const fileName = commandParameters.arguments.dataSetName;
        const ext = (commandParameters.arguments.extension ? commandParameters.arguments.extension : ".txt");
        const hashLen = 8;
        if (commandParameters.positionals.includes('uss')){
            // Hash in a repeatable way if uss fileName (to get around any potential special characters in name)
            const crypto = require("crypto");
            const hash = crypto.createHash('sha256', fileName, { outputLength: 2 });
            return tmpdir() +"\\" + `${(hash.digest('base64')).substring(0,8)}`
        }else{
            return tmpdir() + "\\" + fileName + "." + ext;
        }
    }

    // Check for tmp path's existance as stash
    public static async checkForStash(tmpDir: string): Promise<boolean>{
        try {
            if (existsSync(tmpDir)) {
                return true;
            }else{
                return false;
            }
        } catch(err) {
            throw new ImperativeError({
                msg: `Failure when checking for stash. Command terminated.`,
                causeErrors: err
            });
        }
    }

    // Prompt users at different points in editing process
    public static async promptUser(prompt: Prompt, filePath?: string): Promise<boolean>{
        let input;
        switch (prompt){
            case Prompt.useStash:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Keep and continue editing found stash? Y/n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: `No input provided. Command terminated.`
                    });
                }
                if (input == lowerCase("y")){
                    return true;
                } else {
                    return false;
                }
            case Prompt.doneEditing:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Enter any value in terminal once finished editing temporary file: ${filePath}`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${filePath}`)
                    });
                }else{
                    return true;
                }
            case Prompt.continueEditing:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`The version of the document you were editing has changed.` +
                    `Continue with current edits? Y/n\n${filePath}\n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${filePath}`)
                    });
                }
                if (input == lowerCase("y")){
                    return true;
                } else {
                    return false;
                }
        }
    }

    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters): Promise<IZosFilesResponse>{
        const handler = new LocalfileDatasetHandler;
        const helper = new CompareBaseHelper(commandParameters);
        const gui = ProcessUtils.isGuiAvailable();

        if(gui === GuiResult.GUI_AVAILABLE){
            helper.browserView = true;
        }

        const lf = await handler.getFile1(session, commandParameters.arguments, helper);
        let mfds: Buffer;
        if (commandParameters.positionals.includes('ds')){
            mfds = await handler.getFile2(session, commandParameters.arguments, helper);
        }else{
            mfds = await handler.getFile3(session, commandParameters.arguments, helper);
        }
        // Editor will open with local file if default editor was set
        return await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mfds));
    }

    public static async makeEdits(session: AbstractSession, commandParameters: IHandlerParameters, tmpDir: string): Promise<void>{
        // Perform file comparison: show diff in terminal, open lf in editor
        // try{
        commandParameters.arguments.localFilePath = tmpDir;
        await this.fileComparison(session, commandParameters);
        if (commandParameters.arguments.editor){
            await ProcessUtils.openInEditor(tmpDir, commandParameters.arguments.editor);
        }
        await this.promptUser(Prompt.doneEditing, tmpDir);
        // }catch(err){
        //     throw new ImperativeError({
        //         msg: TextUtils.chalk.red(`Command terminated. Failure when editing. Check state of temporary file: ${tmpDir}`),
        //         causeErrors: err
        //     });
        // }
    }

    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters, lfDir: string, lfFileResp: IZosFilesResponse): Promise<boolean>{
    // Once input recieved, upload tmp file with saved etag
    // if matching etag: sucessful upload, destroy tmp file -> END
    // if non-matching etag: unsucessful upload -> perform file comparison/edit again with new etag
        const fileName = commandParameters.arguments.dataSetName;
        let response: IZosFilesResponse;
        try{
            if (commandParameters.positionals.includes('uss')){
                response = await Upload.fileToUssFile(session, lfDir, fileName, {etag: lfFileResp.apiResponse.etag});
            }else{
                response = await Upload.fileToDataset(session, lfDir, fileName, {etag: lfFileResp.apiResponse.etag});
            }
            if (response.success){
                // If matching etag & successful upload, destroy tmp file -> END
                await this.destroyTempFile(lfDir);
                return true;
            }
            if (response.errorMessage){
                if (response.errorMessage.includes("etag")){ //or error 412
                    //alert user that the version of document they've been editing has changed
                    //ask if they want to continue working with their stash (local file)
                    const continueToEdit: boolean = await this.promptUser(Prompt.continueEditing, lfDir);
                    if (continueToEdit){
                        // Download dataset again, refresh the etag of lfFile
                        lfFileResp = await Download.dataSet(session, fileName,
                            {returnEtag: true, file: lfDir, overwrite: false});
                        // Then perform file comparision with mfds and lf(file youve been editing) with updated etag
                        await this.makeEdits(session, commandParameters, lfDir);
                        return false;
                    }else{
                        // Renew stash based on updated file version (overwrite stash)
                        lfFileResp = await Download.dataSet(session, fileName,
                            {returnEtag: true, file: lfDir});
                        await this.makeEdits(session, commandParameters, lfDir);
                        return false;
                    }
                }
                throw new ImperativeError({
                    msg: TextUtils.chalk.red(`Failed to save edits because remote has changed since last downloading file.` +
                    `Edits have been stored locally: ${lfDir}`)
                });
            }
        }catch(err){
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`Command terminated. Stashed file will persist: ${lfDir}`),
                causeErrors: err
            });
        }
    }

    public static async destroyTempFile(tmpDir:string): Promise<void>{
        unlink (tmpDir, (err) => {
            if (err) throw new ImperativeError({
                msg: `Temporary file could not be deleted: ${tmpDir}`,
                causeErrors: err
            });
        });
    }
}
