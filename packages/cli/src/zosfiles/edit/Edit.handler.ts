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
import { EditUtilities as Utils, Prompt, LocalFile } from "../edit/Edit.utils";

/**
 * Handler to Edit USS or DS content locally
 * @export
 */
export default class EditHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // Setup
        const guiAvail = ProcessUtils.isGuiAvailable();
        let lfFile = new LocalFile;
        lfFile.path = commandParameters.arguments.localFilePath = await Utils.buildTempPath(commandParameters);

        // Use or override stash (either way need to retrieve etag)
        const stash: boolean = await Utils.checkForStash(lfFile.path);
        let keepStash: boolean = false;
        if (stash) {
            keepStash = await Utils.promptUser(Prompt.useStash);
        }

        // Download etag and possibly mf file to edit locally (if not using stash)
        try{
            const task: ITaskWithStatus = {
                percentComplete: 10,
                statusMessage: "Retrieving file",
                stageName: TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({task});

            lfFile = await Utils.localDownload(session, commandParameters, lfFile, keepStash, guiAvail);

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

        // Edit local copy of mf file
        if (guiAvail == GuiResult.GUI_AVAILABLE){
            await Utils.makeEdits(lfFile.path, commandParameters.arguments.editor);
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