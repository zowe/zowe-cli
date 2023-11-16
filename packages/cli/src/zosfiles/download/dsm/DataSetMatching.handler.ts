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

import { AbstractSession, IHandlerParameters, ImperativeError, ImperativeExpect, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { IZosFilesResponse, Download, IDownloadOptions, IDsmListOptions, List } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download all members from a pds
 * @export
 */
export default class DataSetMatchingHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const extensionMap: {[key: string]: string} = {};
        try {
            if (commandParameters.arguments.extensionMap) {
                commandParameters.arguments.extensionMap = commandParameters.arguments.extensionMap.toLowerCase();
                const unoptimizedMap = commandParameters.arguments.extensionMap.split(",");
                for (const entry of unoptimizedMap) {
                    const splitEntry = entry.split("=");
                    ImperativeExpect.toBeEqual(splitEntry.length, 2);
                    extensionMap[splitEntry[0]] = splitEntry[1];
                }
            }
        } catch (err) {
            throw new ImperativeError({msg: "An error occurred processing the extension map.", causeErrors: err});
        }

        const listStatus: ITaskWithStatus = {
            statusMessage: "Searching for data sets",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        const listOptions: IDsmListOptions = {
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            task: listStatus,
            responseTimeout: commandParameters.arguments.responseTimeout
        };

        commandParameters.response.progress.startBar({ task: listStatus });
        const response = await List.dataSetsMatchingPattern(session, commandParameters.arguments.pattern.split(","), listOptions);
        commandParameters.response.progress.endBar();
        if (response.success) {
            commandParameters.response.console.log(`\r${response.commandResponse}\n`);
        } else {
            return response;
        }

        const downloadStatus: ITaskWithStatus = {
            statusMessage: "Downloading data sets",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        const downloadOptions: IDownloadOptions = {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary,
            record: commandParameters.arguments.record,
            encoding: commandParameters.arguments.encoding,
            directory: commandParameters.arguments.directory,
            extension: commandParameters.arguments.extension,
            extensionMap: commandParameters.arguments.extensionMap ? extensionMap : undefined,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            preserveOriginalLetterCase: commandParameters.arguments.preserveOriginalLetterCase,
            failFast: commandParameters.arguments.failFast,
            task: downloadStatus,
            responseTimeout: commandParameters.arguments.responseTimeout
        };

        commandParameters.response.progress.startBar({ task: downloadStatus });
        return Download.allDataSets(session, response.apiResponse, downloadOptions);
    }
}
