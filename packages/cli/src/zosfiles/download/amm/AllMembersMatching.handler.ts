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
import { IZosFilesResponse, Download, IDsmListOptions, List } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download all members given a data set name & pattern
 * @export
 */
export default class AllMembersMatchingHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const listStatus: ITaskWithStatus = {
            statusMessage: "Searching for members",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        const listOptions: IDsmListOptions = {
            excludePatterns: commandParameters.arguments.excludePatterns?.split(","),
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            task: listStatus,
            responseTimeout: commandParameters.arguments.responseTimeout
        };
        commandParameters.response.progress.startBar({ task: listStatus });
        const response = await List.membersMatchingPattern(session, commandParameters.arguments.dataSetName,
            commandParameters.arguments.pattern.split(","), listOptions);
        commandParameters.response.progress.endBar();
        if (response.success) {
            commandParameters.response.console.log(`\r${response.commandResponse}\n`);
        } else {
            return response;
        }
        const status: ITaskWithStatus = {
            statusMessage: "Downloading all members",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});
        return Download.allMembers(session, commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary,
            record: commandParameters.arguments.record,
            encoding: commandParameters.arguments.encoding,
            directory: commandParameters.arguments.directory,
            extension: commandParameters.arguments.extension,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            preserveOriginalLetterCase: commandParameters.arguments.preserveOriginalLetterCase,
            failFast: commandParameters.arguments.failFast,
            task: status,
            responseTimeout: commandParameters.arguments.responseTimeout,
            memberPatternResponse: response.apiResponse,
        });
    }
}