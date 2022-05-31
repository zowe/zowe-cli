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
import { IZosFilesResponse, Download } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download all members from a pds
 * @export
 */
export default class DataSetMatchingHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const status: ITaskWithStatus = {
            statusMessage: "Downloading data sets matching a pattern",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});
        return Download.dataSetsMatchingPattern(session, commandParameters.arguments.pattern.split(","), {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary,
            record: commandParameters.arguments.record,
            encoding: commandParameters.arguments.encoding,
            directory: commandParameters.arguments.directory,
            extension: commandParameters.arguments.extension,
            excludePatterns: commandParameters.arguments.excludePatterns?.split(","),
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            preserveOriginalLetterCase: commandParameters.arguments.preserveOriginalLetterCase,
            failFast: commandParameters.arguments.failFast,
            task: status,
            responseTimeout: commandParameters.arguments.responseTimeout
        });
    }
}
