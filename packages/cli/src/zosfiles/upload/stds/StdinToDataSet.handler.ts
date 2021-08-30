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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, TextUtils } from "@zowe/imperative";
import { IZosFilesResponse, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Readable } from "stream";

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
            process.stdin as unknown as Readable,
            /* process.stdin has all the functions/properties we need to treat it as a Readable stream
            *  from the rest client,
            *  such as .on("data"), and .on("error")
            */
            commandParameters.arguments.dataSetName, {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
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
