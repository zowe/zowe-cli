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

import { AbstractSession, IHandlerParameters, ImperativeError, ProcessUtils, GuiResult, TextUtils, IDiffOptions } from "@zowe/imperative";
import { tmpdir } from "os";
import { Download, Upload, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import LocalfileDatasetHandler from "../compare/lf-ds/LocalfileDataset.handler";
import { CompareBaseHelper } from "../compare/CompareBaseHelper";
import { CliUtils } from "@zowe/imperative";
import { unlink, existsSync } from "fs";

export class LocalFile {
    dir: string;
    zosResp: IZosFilesResponse;
}
export enum Prompt {
    useStash,
    doneEditing,
    continueToUpload
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
            return tmpdir() +"\\" + `${(hash.digest('base64')).substring(0,8)}` + "." + ext;
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
                if (input.toLowerCase() == 'y'){
                    //keep stash
                    return true;
                } else {
                    //override stash
                    return false;
                }
            case Prompt.doneEditing:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`Enter any value in terminal once finished editing and saving temporary file: ${filePath}`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${filePath}`)
                    });
                }else{
                    return true;
                }
            case Prompt.continueToUpload:
                input = await CliUtils.readPrompt(TextUtils.chalk.green(`The version of the document you were editing has changed.` +
                    `Continue uploading current edits? Y/n\n${filePath}\n`));
                if (input === null) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`No input provided. Command terminated. Stashed file will persist: ${filePath}`)
                    });
                }
                if (input.toLowerCase() == 'y'){
                    //upload
                    return true;
                } else {
                    //open diff, keep editing
                    return false;
                }
        }
    }

    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters): Promise<IZosFilesResponse>{
        const handler = new LocalfileDatasetHandler;
        const helper = new CompareBaseHelper(commandParameters);
        const gui = ProcessUtils.isGuiAvailable();
        const options: IDiffOptions = {
            name1: "local file",
            name2: "mainframe file"
        }

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
        return await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mfds), options);
    }

    public static async makeEdits(session: AbstractSession, commandParameters: IHandlerParameters): Promise<void>{
        const tmpDir = commandParameters.arguments.localFilePath;
        // Perform file comparison: show diff in terminal, open lf in editor
        if (commandParameters.arguments.editor){
            await ProcessUtils.openInEditor(tmpDir, commandParameters.arguments.editor);
        }
        await this.promptUser(Prompt.doneEditing, tmpDir);

    }

    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: LocalFile): Promise<boolean>{
    // Once input recieved, upload tmp file with saved etag
    // if matching etag: sucessful upload, destroy tmp file -> END
    // if non-matching etag: unsucessful upload -> perform file comparison/edit again with new etag
        let response: IZosFilesResponse;
        let fileName;
        try{
            if (commandParameters.positionals.includes('uss')){
                fileName = commandParameters.arguments.file;
                response = await Upload.fileToUssFile(session, lfFile.dir, '/z/at895452/hello.c', {etag: lfFile.zosResp.apiResponse.etag});
            }else{
                fileName =commandParameters.arguments.dataSetName;
                response = await Upload.fileToDataset(session, lfFile.dir, fileName, {etag: lfFile.zosResp.apiResponse.etag});
            }
            if (response.success){
                // If matching etag & successful upload, destroy tmp file -> END
                await this.destroyTempFile(lfFile.dir);
                return true;
            }
        }catch(err){
            if (err.errorCode && err.errorCode == 412){
                // open a fileComparision
                await this.fileComparison(session, commandParameters);
                //alert user that the version of document they've been editing has changed
                //ask if they want to continue working with their stash (local file)
                const continueToUpload: boolean = await this.promptUser(Prompt.continueToUpload, lfFile.dir);
                if (continueToUpload){
                    // Refresh the etag of lfFile (keep stash)
                    if (commandParameters.positionals.includes('uss')){
                        lfFile.zosResp = await Download.ussFile(session, '/z/at895452/hello.c',
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
                        lfFile.zosResp = await Download.ussFile(session, '/z/at895452/hello.c',
                            {returnEtag: true, file: lfFile.dir});
                    }
                    else{
                        lfFile.zosResp = await Download.dataSet(session, fileName,
                        {returnEtag: true, file: lfFile.dir});
                    }
                    // open lf in editor
                    await this.makeEdits(session, commandParameters);
                    return false;
                }
            }
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`Command terminated. Stashed file will persist: ${lfFile.dir}`),
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
