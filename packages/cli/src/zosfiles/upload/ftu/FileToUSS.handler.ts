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
import { Upload } from "../../../../../../packages/zosfiles/src/methods/upload";
import { IZosFilesResponse } from "../../../../../../packages/zosfiles";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to upload content from a local file to a USS file
 * @export
 */
export default class FileToUSSHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Uploading USS file",
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({ task });

        const response = await Upload.fileToUssFile(session, commandParameters.arguments.inputfile,
            commandParameters.arguments.USSFileName, {
            binary: commandParameters.arguments.binary,
            encoding: commandParameters.arguments.encoding,
            task,
            responseTimeout: commandParameters.arguments.responseTimeout
        });

        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }
}
