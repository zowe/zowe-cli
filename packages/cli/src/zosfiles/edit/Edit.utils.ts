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

import { AbstractSession, ICommandArguments, IHandlerParameters, ImperativeError, ProcessUtils } from "@zowe/imperative";
import { PathLike } from "fs";
import { tmpdir } from "os";
import path = require("path");
import { Download, Upload, IZosFilesOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
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
    name: string;
    data: IZosFilesResponse;
    etag: string;
}
  
  
  export class EditUtilities {

    // 2. build tmp_dir
    public static async buildTempDir(session: AbstractSession, fileName: PathLike, isUssFile?: boolean): Promise<string>{
        let tmpDir = tmpdir();

        if (isUssFile){
            // 2a. hash if uss fileName
            const crypto = require("crypto");
            return tmpDir +"/" + crypto.createHash("shake256", { outputLength: 8 })
                .update(fileName)
                .digest("hex");
        }else{
            return tmpDir + "/" + fileName;
        }
    }

    // 3. check for tmp_dir's existance as stash
    public static async checkForStash(tmpDir: string): Promise<boolean>{
        try {
          if (existsSync(tmpDir)) {
            return true;
          }else{
            return false;
          }
        } catch(err) {
          console.error(err); //change to imperative error probably?
        }
    }

    // override stash?
    public static async newStash(session: AbstractSession, fileName: string, isUssFile?: boolean): Promise<IZosFilesResponse>{
        if (isUssFile){
            return await Download.ussFile(session, fileName, {returnEtag: true});
        }
        return await Download.dataSet(session, fileName, {returnEtag: true});
    }

    public static async promptUser(prompt: Prompt, fileInfo?: string): Promise<boolean>{
        let input;
        switch (prompt){
            case Prompt.useStash:
                input = await CliUtils.readPrompt("Keep and continue editing found stash? Y/n");
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
            case Prompt.doneEditing:
                input = await CliUtils.readPrompt("Enter any value in terminal once finished editing temporary file");
                if (input === null) {
                    // abort the command
                }else{
                    return true;
                }
            case Prompt.continueEditing:
                ``
                input = await CliUtils.readPrompt("The version of the document you were editing has changed. Continue to make changes? Y/n\n" + fileInfo);
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

        // 4ba. perform file comparison, show output in terminal
        commandParameters.arguments.localFilePath = lfFile.path;
        const lf = await handler.getFile1(session, commandParameters.arguments, helper);
        const mfds = await handler.getFile2(session, commandParameters.arguments, helper);

        // ProcessUtils.openInDefaultApp(lfFile.path)

        // // 5a. check for default editor and headless environment
        // // 5b. open lf in editor or tell user to open up on their own if headless or no set default
        return await helper.getResponse(helper.prepareContent(lf), helper.prepareContent(mfds));
    }




    public static async uploadEdits(session: AbstractSession, lfFile: File): Promise<IZosFilesResponse>{
    // 7. once input recieved, upload tmp file with saved ETAG
    // 7a. if matching ETAG: sucessful upload, destroy tmp file -> END
    // 7a. if non-matching ETAG: unsucessful upload -> 4a
        let response: IZosFilesResponse;
        try{
            response = await Upload.fileToDataset(session, lfFile.path, lfFile.name, {etag: lfFile.etag});
            // successful upload
            return response;
        }catch(err){
            // unsuccessful upload, potential mismatched etag
            return response;
        }
    }

    public static async destroyTempFile(tmpDir:string): Promise<void>{
        unlink (tmpDir, (err) => {
            if (err) throw new ImperativeError({
                msg: `Temporary file could not be deleted: ${tmpDir}`
            });
        })
    }
  }
