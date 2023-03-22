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
        let uploaded = await Utils.uploadEdits(session, commandParameters, lfFile, mfFile);
        while (!uploaded) {
            // might have to make a new object here for uploaded... to indicate if successful and also send back etag to then pass in to new call to uploadEdits...need to change structures around to keep track of etag
            uploaded = await Utils.uploadEdits(session, commandParameters, lfFile, mfFile);
        }

        return //something?;
    }
}


// ended tuesday by trying to refactor/condense uploadEdits.. thinking about how to handle problem of potentially getting stuck in loop where the version youre editing is constantly being changed everytime you try to save