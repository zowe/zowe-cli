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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, TextUtils } from "@brightside/imperative";
import { Upload } from "../../../api/methods/upload";
import { IZosFilesResponse } from "../../../api";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IUploadResult } from "../../../api/methods/upload/doc/IUploadResult";
import * as path from "path";

/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */

export default class DirToUssDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {
        const status: ITaskWithStatus = {
            statusMessage: "Uploading directory to USS",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});

        commandParameters.arguments.inputdir = path.resolve(commandParameters.arguments.inputdir);

        const response = await Upload.dirToUssDir(session, commandParameters.arguments.inputdir,commandParameters.arguments.USSDir,
            commandParameters.arguments.binary, commandParameters.arguments.recursive);
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
