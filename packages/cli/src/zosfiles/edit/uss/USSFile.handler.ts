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
import { Download, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { tmpdir } from "os";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { EditUtilities as Utils, Prompt, LocalFile } from "../Edit.utils";

/**
 * Handler to Edit USS file content locally
 * @export
 */
export default class USSFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // Setup
        const guiAvail = ProcessUtils.isGuiAvailable();
        const lfFile = new LocalFile;
        lfFile.path = commandParameters.arguments.localFilePath = await Utils.buildTempPath(commandParameters);

        // Use or override stash (either way need to retrieve etag)
        const stash: boolean = await Utils.checkForStash(lfFile.path);
        let keepStash: boolean = false;
        if (stash) {
            keepStash = await Utils.promptUser(Prompt.useStash);
        }
        try{
            const task: ITaskWithStatus = {
                percentComplete: 10,
                statusMessage: "Retrieving USS file",
                stageName: TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({task});

            if (!keepStash || !stash) {
                lfFile.zosResp = await Download.ussFile(session, commandParameters.arguments.file, {returnEtag: true, file: lfFile.path});
            }else{
                if (guiAvail == GuiResult.GUI_AVAILABLE){
                    // Show difference between your lf and mfFile
                    Utils.fileComparison(session, commandParameters);
                }
                // Download just to get etag. Don't overwrite prexisting lf file (stash) during process // etag = lfFile.zosResp.apiResponse.etag
                lfFile.zosResp = await Download.ussFile(session, commandParameters.arguments.file, {returnEtag: true, file: tmpdir()+'toDelete'});
                Utils.destroyTempFile((tmpdir()+'toDelete'));
            }
            task.percentComplete = 70;
            task.stageName = TaskStage.COMPLETE;
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
            ),
            apiResponse: {}//return IZosFilesResponse here and pertinent file deets
        };
    }
}