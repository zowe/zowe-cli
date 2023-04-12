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

import { AbstractSession, GuiResult, IHandlerParameters,
    ITaskWithStatus, ImperativeError, ProcessUtils, TaskStage, TextUtils } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../ZosFilesBase.handler";
import { EditUtilities as Utils, Prompt, EditFileType, LocalFile } from "../edit/Edit.utils";

/**
 * Handler to Edit USS or DS content locally
 * @export
 */
export default class EditHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // Setup
        let lfFile = new LocalFile;
        lfFile.guiAvail = ProcessUtils.isGuiAvailable() === GuiResult.GUI_AVAILABLE;
        lfFile.fileName = commandParameters.arguments.file ?? commandParameters.arguments.dataSetName;
        lfFile.tempPath = commandParameters.arguments.localFilePath = await Utils.buildTempPath(lfFile, commandParameters);
        lfFile.fileType = commandParameters.positionals.includes('ds') ? EditFileType.ds : EditFileType.uss;

        // Use or override stash (either way need to retrieve etag)
        const stash: boolean = await Utils.checkForStash(lfFile.tempPath);
        let useStash: boolean = false;
        if (stash) {
            useStash = await Utils.promptUser(Prompt.useStash);
        }

        // Download etag and possibly mf file to edit locally (if not using stash)
        try{
            const task: ITaskWithStatus = {
                percentComplete: 10,
                statusMessage: "Retrieving file",
                stageName: TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({task});

            // show a file comparision for the purpose of seeing the newer version of the remote mf file compared to your local edits
            if (useStash && lfFile.guiAvail){
                Utils.fileComparison(session, commandParameters);
            }
            lfFile = await Utils.localDownload(session, lfFile, useStash);

            task.percentComplete = 70;
            commandParameters.response.progress.endBar();
        }catch(error){
            if (error.causeErrors && error.causeErrors.code == 'ENOTFOUND'){
                throw new ImperativeError({
                    msg: TextUtils.chalk.red(`ENOTFOUND: Unable to connect to mainframe.`),
                    causeErrors: error
                });
            }
            throw new ImperativeError({
                msg: TextUtils.chalk.red(`File not found on mainframe. Command terminated.`),
                causeErrors: error
            });
        }

        // Edit local copy of mf file (automatically open an editor for user if not in headless linux)
        if (lfFile.guiAvail){
            await Utils.makeEdits(lfFile.tempPath, commandParameters.arguments.editor);
        }

        // Once done editing, user will provide terminal input. Upload local file with saved etag
        let uploaded = false;
        do {
            uploaded = await Utils.uploadEdits(session, commandParameters, lfFile);
        } while (!uploaded);
        return {
            success: true,
            commandResponse: TextUtils.chalk.green(
                "Successfully uploaded edited file to mainframe"
            )
        };
    }
}