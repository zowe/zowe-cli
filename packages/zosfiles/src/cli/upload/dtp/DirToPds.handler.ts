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
import { IZosFilesResponse } from "../../../api";
import { Upload } from "../../../api/methods/upload";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IUploadResult } from "../../../api/methods/upload/doc/IUploadResult";

/**
 * Handler to upload content of a directory to a PDS
 * @export
 */
export default class DirToPdsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {

        const status: ITaskWithStatus = {
            statusMessage: "Uploading directory to PDS",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});
        const response = await Upload.dirToPds(
            session,
            commandParameters.arguments.inputdir,
            commandParameters.arguments.dataSetName,
            {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                task: status,
                responseTimeout: commandParameters.arguments.responseTimeout
            }
        );

        if (response.apiResponse) {
            let skipCount: number = 0;
            let successCount: number = 0;
            let errorCount: number = 0;
            response.apiResponse.forEach((element: IUploadResult) => {
                if (element.success === true) {
                    const formatMessage = TextUtils.prettyJson(element);
                    commandParameters.response.console.log(formatMessage);
                    successCount++;
                } else if (element.success === false) {

                    const formatMessage = TextUtils.prettyJson(element);
                    commandParameters.response.console.error(TextUtils.chalk.red(formatMessage));
                    errorCount++;
                } else {
                    skipCount++;
                }
            });

            commandParameters.response.console.log(TextUtils.prettyJson({
                file_to_upload: response.apiResponse.length,
                success: successCount,
                error: errorCount,
                skipped: skipCount
            }));
        }

        return response;
    }
}
