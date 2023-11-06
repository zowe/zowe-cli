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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/core-for-zowe-sdk";
import { IZosFilesResponse, Download, IDownloadOptions, IUSSListOptions, ZosFilesAttributes } from "@zowe/zos-files-for-zowe-sdk";
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

        const zosAttributes: ZosFilesAttributes = ZosFilesAttributes.loadFromFile(commandParameters.arguments.attributes,
            commandParameters.arguments.directory);

        const downloadOptions: IDownloadOptions = {
            binary: commandParameters.arguments.binary,
            directory: commandParameters.arguments.directory,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            task: downloadStatus,
            responseTimeout: commandParameters.arguments.responseTimeout,
            failFast: commandParameters.arguments.failFast,
            attributes: zosAttributes,
            includeHidden: commandParameters.arguments.includeHidden,
            overwrite: commandParameters.arguments.overwrite,
            encoding: commandParameters.arguments.encoding
        };
        const listOptions: IUSSListOptions = {
            name: commandParameters.arguments.name ? commandParameters.arguments.name : "*",
            maxLength: commandParameters.arguments.maxLength,
            group: commandParameters.arguments.group,
            user: commandParameters.arguments.owner,
            mtime: commandParameters.arguments.mtime,
            size: commandParameters.arguments.size,
            perm: commandParameters.arguments.perm,
            type: commandParameters.arguments.type,
            depth: commandParameters.arguments.depth,
            filesys: commandParameters.arguments.filesys,
            symlinks: commandParameters.arguments.symlinks
        };

        commandParameters.response.progress.startBar({ task: downloadStatus });
        const response = await Download.ussDir(session, commandParameters.arguments.ussDirName, downloadOptions, listOptions);
        commandParameters.response.progress.endBar();
        return response;
    }
}
