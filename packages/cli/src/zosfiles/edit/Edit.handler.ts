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
    ITaskWithStatus, ImperativeError, ProcessUtils, RestConstants, TaskStage, TextUtils } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../ZosFilesBase.handler";
import { EditUtilities as Utils, Prompt, ILocalFile } from "../edit/Edit.utils";

/**
 * Handler to Edit USS or DS content locally
 * @export
 */
export default class EditHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // Setup - build temp and check for stash
        let lfFile: ILocalFile = {
            tempPath: null,
            fileName: commandParameters.arguments.ussFilePath ?? commandParameters.arguments.dataSetName,
            fileType: commandParameters.positionals[2].includes('d') ? "ds" : "uss",
            guiAvail: ProcessUtils.isGuiAvailable() === GuiResult.GUI_AVAILABLE,
            zosResp: null
        };
        lfFile.tempPath = commandParameters.arguments.localFilePath = await Utils.buildTempPath(lfFile, commandParameters);

        // Use or override stash if exists
        const stash: boolean = await Utils.checkForStash(lfFile.tempPath);
        let useStash, viewDiff: boolean = false;
        if (stash) {
            useStash = await Utils.promptUser(Prompt.useStash);
        }

        // Retrieve etag & download mf file to edit locally if not using stash
        try{
            const task: ITaskWithStatus = {
                percentComplete: 10,
                statusMessage: "Retrieving file",
                stageName: TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({task});

            // Retrieve etag AND file contents if not using stash
            lfFile = await Utils.localDownload(session, lfFile, useStash);
            commandParameters.response.progress.endBar();

            // Show a file comparison for the purpose of seeing the current version of remote compared to past edits
            if (useStash){
                viewDiff = await Utils.promptUser(Prompt.viewDiff);
                if (viewDiff){
                    await Utils.fileComparison(session, commandParameters);
                }
            }

        }catch(error){
            if (error instanceof ImperativeError && error.errorCode === String(RestConstants.HTTP_STATUS_404)) {
                throw new ImperativeError({
                    msg: TextUtils.chalk.red(`File not found on mainframe. Command terminated.`),
                    causeErrors: error
                });
            } else {
                throw error;
            }
        }

        // Edit local copy of mf file (automatically open an editor for user if not in headless linux)
        commandParameters.response.console.log(TextUtils.chalk.green(`Temp file location: `) +
        TextUtils.chalk.blue(lfFile.tempPath));

        const overwrite = await Utils.makeEdits(lfFile, commandParameters.arguments.editor);

        if (!overwrite){
            return {
                success: true,
                commandResponse: TextUtils.chalk.green(
                    "Exiting now. Temp file persists for editing."
                )
            };
        }

        // Once done editing, user will provide terminal input. Upload local file with saved etag
        let uploaded = false;
        let canceled = false;
        do {
            [uploaded, canceled] = await Utils.uploadEdits(session, commandParameters, lfFile);
        } while (!uploaded && !canceled);
        if (!canceled){
            return {
                success: true,
                commandResponse: TextUtils.chalk.green(
                    "Successfully uploaded edits to mainframe."
                )
            };
        } else {
            return {
                success: true,
                commandResponse: TextUtils.chalk.green(
                    "Exiting now. Temp file persists for editing."
                )
            };
        }

    }
}