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

import { AbstractSession, IHandlerParameters, ImperativeError, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { Get, Download, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { EditUtilities, Prompt, File } from "../Edit.utils"

/**
 * Handler to edit a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Begining process to Edit data set",
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task});

        // 1. Setup
        const Utils = EditUtilities;
        const mfFile = new File;
        const lfFile = new File;
        mfFile.name = commandParameters.arguments.file;
        mfFile.data = await Download.dataSet(session, mfFile.name, {returnEtag: true});
        // mfFile.etag = [ TO DO ]

        // 2. Build tmp_dir
        const tmpDir: string = await Utils.buildTempDir(session, mfFile.name, false);

        // 3. Use or override stash (either way need to retrieve etag)
        let stash: boolean = await Utils.checkForStash(tmpDir);
        let overrideStash: boolean = false;
        if (stash) {
            overrideStash = await Utils.promptUser(Prompt.useStash);
        }
        if (overrideStash || !stash) {
            lfFile.data = await Utils.newStash(session, mfFile.name);
            // lfFile.etag = [ TO DO ]
            lfFile.path = tmpDir;
        }
        
        await Utils.makeEdits(session, commandParameters, lfFile);
        // 7. once input recieved, upload tmp file with saved ETAG


        let response: IZosFilesResponse = await Utils.uploadEdits(session, lfFile);
        // if (response.success){
        //     // 7a. if matching ETAG & successful upload, destroy tmp file -> END
        //     await Utils.destroyTempFile(lfFile.path);
        //     return response;
        // }
        // if (response.errorMessage){
            if (response.errorMessage.includes("etag")){
                // 7a. if non-matching ETAG: unsucessful upload -> 4a
                //alert user that the version of document theyve been editing has changed.
                // 1. ask if they want to continue working w this file
                let continueToEdit: boolean = await Utils.promptUser(Prompt.continueEditing, lfFile.path);
                if (continueToEdit){
                    // if yes, 
                    // 1. download dataset again, refresh the etag of lfFile
                    mfFile.data = await Download.dataSet(session, mfFile.name, {returnEtag: true});
                    // [TO DO - set etag]
                    lfFile.etag = mfFile.etag ;
                    // 2. then perform a file comparision:
                    await Utils.makeEdits(session, commandParameters, lfFile);
                    // 3. perform file comparision w mfds and lf(file youve been editing) with updated etag
                    
                }else{
                    //end program, leave temp file
                }
            }else{
                throw new ImperativeError({
                    msg: `Temporary file could not be deleted: ${tmpDir}`
                });
            }
        return //something;
    }
}


// ended tuesday by trying to refactor/condense uploadEdits.. thinking about how to handle problem of potentially getting stuck in loop where the version youre editing is constantly being changed everytime you try to save