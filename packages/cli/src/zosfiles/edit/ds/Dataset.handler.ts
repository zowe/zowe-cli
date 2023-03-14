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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to edit a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // 1. get/set editor
        // 2. build tmp_dir
        // 2a. hash uss file name
        // 3. check for tmp_dir's existance as stash
        // 4a. if prexisting tmp_dir: override stash
        // 4b. if prexisting tmp_dir: use stash
        // 4ba. perform file comparison, show output in terminal
        // 4bb. overwrite ETAG 
        // 5a. check for default editor and headless environment
        // 5b. open lf in editor or tell user to open up on their own if headless or no set default
        // 6. wait for user input to continue
        // 7. once input recieved, upload tmp file with saved ETAG
        // 7a. if matching ETAG: sucessful upload, destroy tmp file -> END
        // 7a. if non-matching ETAG: unsucessful upload -> 4a

        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving data set",
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task});

        const dsContentBuf = await Get.dataSet(session, commandParameters.arguments.dataSetName,
            {   
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );
        return {
            success: true,
            commandResponse: dsContentBuf.toString(),
            apiResponse: {}
        };
    }
}
