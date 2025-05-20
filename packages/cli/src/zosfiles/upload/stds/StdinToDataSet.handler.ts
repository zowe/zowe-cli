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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, TextUtils } from "npm:@zowe/imperative";
import { IZosFilesResponse, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to stream data from stdin to a data set
 * @export
 */
export default class StdinToDataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
        session: AbstractSession): Promise<IZosFilesResponse> {

        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Uploading stdin to data set",
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task});

        const result = await Upload.streamToDataSet(session,
            commandParameters.stdin,
            commandParameters.arguments.dataSetName, {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                record: commandParameters.arguments.record,
                task,
                responseTimeout: commandParameters.arguments.responseTimeout
            });

        if (result.success) {
            const formatMessage = TextUtils.prettyJson({
                success: result.success,
                from: "stdin",
                to: commandParameters.arguments.dataSetName
            });
            commandParameters.response.console.log(formatMessage);
        }
        return result;
    }
}
