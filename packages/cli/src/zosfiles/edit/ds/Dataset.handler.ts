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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, TextUtils } from "@zowe/imperative";
import { Download, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { EditUtilities, Prompt, File } from "../Edit.utils";

/**
 * Handler to edit a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // Setup
        const Utils = EditUtilities;
        const mfFile = new File;
        const lfFile = new File;
        mfFile.fileName =  lfFile.fileName = commandParameters.arguments.dataSetName;

        // Build tmp_dir
        lfFile.path = await Utils.buildTempDir(mfFile.fileName, false);

        // Use or override stash (either way need to retrieve etag)
        const stash: boolean = await Utils.checkForStash(lfFile.path);
        let overrideStash: boolean = false;

        if (stash) {
            overrideStash = await Utils.promptUser(Prompt.useStash);
        }
        try{
            const task: ITaskWithStatus = {
                percentComplete: 10,
                statusMessage: "Finding mainframe data set",
                stageName: TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({task});

            if (overrideStash || !stash) {
                    mfFile.zosFilesResp = lfFile.zosFilesResp = await Download.dataSet(session, lfFile.fileName,
                        {returnEtag: true, file: lfFile.path});
            }else{
                // Download just to get etag. Don't overwrite prexisting file (stash) during process // etag = with.apiResponse.etag
                mfFile.zosFilesResp = lfFile.zosFilesResp = await Download.dataSet(session, lfFile.fileName,
                    {returnEtag: true, file: lfFile.path, overwrite: false});
            }
            task.percentComplete = 70;
            task.stageName = TaskStage.COMPLETE;
        }catch(error){
            //need to catch errors here for filenames that dont exist
            return error;
        }

        // Edit local copy of mf file
        await Utils.makeEdits(session, commandParameters, lfFile);

        // Once done editing, user will provide terminal input. Upload local file with saved etag
        let uploaded = await Utils.uploadEdits(session, commandParameters, lfFile, mfFile);
        while (!uploaded) {
            uploaded = await Utils.uploadEdits(session, commandParameters, lfFile, mfFile);
        }

        return {
            success: true,
            commandResponse: TextUtils.chalk.green(
                "Successfully uploaded edited file to mainframe"
            ),
            apiResponse: {}//return IZosFilesResponse here and pertinent file deets
        };
    }
}