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

import { AbstractSession, IHandlerParameters, ImperativeError } from "@zowe/imperative";
import { PathLike } from "fs";
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

export class File {
    path: string;
    fileName: string;
    zosFilesResp: IZosFilesResponse;
}

export class EditUtilities {
    // Build tmp_dir
    public static async buildTempDir(fileName: PathLike, isUssFile?: boolean): Promise<string>{
        if (isUssFile){
            // Hash in a repeatable way if uss fileName
            const crypto = require("crypto");
            return tmpdir() +"/" + crypto.createHash("shake256", { outputLength: 8 })
                .update(fileName)
                .digest("hex");
        }else{
            return tmpdir() + "/" + fileName;
        }
    }

    // Check for tmp_dir's existance as stash
    public static async checkForStash(tmpDir: string): Promise<boolean>{
        try {
            if (existsSync(tmpDir)) {
                return true;
            }else{
                return false;
            }
        } catch(err) {
            //imperative error probably?
        }
    }

    public static async promptUser(prompt: Prompt, fileInfo?: string): Promise<boolean>{
        let input;
        switch (prompt){
            case Prompt.useStash:
                input = await CliUtils.readPrompt("Keep and continue editing found stash? Y/n");
                if (input === null) {
                    // abort the command ... maybe do something w esc
                }
                if (input == lowerCase("y")){
                    // keep stash
                    return true;
                } else {
                    // override stash
                    return false;
                }
            case Prompt.doneEditing:
                input = await CliUtils.readPrompt("Enter any value in terminal once finished editing temporary file");
                if (input === null) {
                    // abort the command
                }else{
                    return true;
                }
                break;
            case Prompt.continueEditing:
                input = await CliUtils.readPrompt("The version of the document you were editing has changed." +
                    "Continue to make changes? Y/n\n" + fileInfo);
                if (input === null) {
                    // abort the command
                }
                if (input == lowerCase("y")){
                    // keep stash
                    return true;
                } else {
                    // override stash
                    return false;
                }
        }
    }

    public static async fileComparison(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: File): Promise<IZosFilesResponse>{
        const handler = new LocalfileDatasetHandler;
        const helper = new CompareBaseHelper(commandParameters);

        commandParameters.arguments.localFilePath = lfFile.path;
        const lf = await handler.getFile1(session, commandParameters.arguments, helper);
        const mfds = await handler.getFile2(session, commandParameters.arguments, helper);
        // Editor will open with local file if default editor was set
        return await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mfds));
    }

    public static async makeEdits(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: File): Promise<void>{
        // Perform file comparison: show diff in terminal, open lf in editor
        await this.fileComparison(session, commandParameters, lfFile);
        await this.promptUser(Prompt.doneEditing);
    }

    public static async uploadEdits(session: AbstractSession, commandParameters: IHandlerParameters, lfFile: File, mfFile: File): Promise<boolean>{
    // !! WIP !!
    // Once input recieved, upload tmp file with saved etag
    // if matching etag: sucessful upload, destroy tmp file -> END
    // if non-matching etag: unsucessful upload -> perform file comparison/edit again with new etag
        let response: IZosFilesResponse;
        try{
            response = await Upload.fileToDataset(session, lfFile.path, lfFile.fileName, {etag: lfFile.zosFilesResp.apiResponse.etag});
            if (response.success){
                // If matching etag & successful upload, destroy tmp file -> END
                await this.destroyTempFile(lfFile.path);
                return true;
            }
            if (response.errorMessage){
                if (response.errorMessage.includes("etag")){ //or error 412
                    //alert user that the version of document they've been editing has changed
                    //ask if they want to continue working w their stash (local file)
                    const continueToEdit: boolean = await this.promptUser(Prompt.continueEditing, lfFile.path);
                    if (continueToEdit){
                        // Download dataset again, refresh the etag of lfFile
                        mfFile.zosFilesResp, lfFile.zosFilesResp = await Download.dataSet(session, lfFile.fileName,
                            {returnEtag: true, file: lfFile.path, overwrite: false});
                        // Then perform file comparision with mfds and lf(file youve been editing) with updated etag
                        await this.makeEdits(session, commandParameters, lfFile);
                        return false;
                    }else{
                        // Renew stash based on updated file version
                        mfFile.zosFilesResp, lfFile.zosFilesResp = await Download.dataSet(session, lfFile.fileName,
                            {returnEtag: true, file: lfFile.path});
                        await this.makeEdits(session, commandParameters, lfFile);
                        return false;
                    }
                }
                throw new ImperativeError({
                    msg: `Failed to save edits because remote has changed since last downloading file.` +
                    `Edits have been stored locally: ${lfFile.path}`
                });
            }
        }catch(err){
            // do some error handling here
            return false;
        }
    }

    public static async destroyTempFile(tmpDir:string): Promise<void>{
        unlink (tmpDir, (err) => {
            if (err) throw new ImperativeError({
                msg: `Temporary file could not be deleted: ${tmpDir}`
            });
        });
    }
}
