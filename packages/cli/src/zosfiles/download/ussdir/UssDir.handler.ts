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
import { IZosFilesResponse, Download, IDownloadOptions, IUSSListOptions } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download all members from a pds
 * @export
 */
export default class UssDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const downloadStatus: ITaskWithStatus = {
            statusMessage: "Searching for files",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };

        const downloadOptions: IDownloadOptions = {
            binary: commandParameters.arguments.binary,
            directory: commandParameters.arguments.directory,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            task: downloadStatus,
            responseTimeout: commandParameters.arguments.responseTimeout
        };
        const listOptions: IUSSListOptions = {
            name: "*"
        };

        commandParameters.response.progress.startBar({ task: downloadStatus });
        const response = await Download.ussDir(session, commandParameters.arguments.ussDirName, downloadOptions, listOptions);
        commandParameters.response.progress.endBar();
        return response;
    }
}
