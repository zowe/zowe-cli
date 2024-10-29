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

import {
    AbstractSession,
    IHandlerParameters,
    ITaskWithStatus,
    TaskStage,
    TextUtils,
} from "@zowe/imperative";
import { Upload, IZosFilesResponse, IUploadOptions, ZosFilesAttributes } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to upload content from a local file to a USS file
 * @export
 */
export default class FileToUSSHandler extends ZosFilesBaseHandler {
    public async processWithSession(
        commandParameters: IHandlerParameters,
        session: AbstractSession
    ): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Uploading USS file",
            stageName: TaskStage.IN_PROGRESS,
        };
        commandParameters.response.progress.startBar({ task });

        const uploadOptions: IUploadOptions = {
            binary: commandParameters.arguments.binary,
            maxConcurrentRequests:
                commandParameters.arguments.maxConcurrentRequests,
            task: task,
            responseTimeout: commandParameters.arguments.responseTimeout,
            includeHidden: commandParameters.arguments.includeHidden,
        };

        const attributes = ZosFilesAttributes.loadFromFile(
            commandParameters.arguments.attributes,
            commandParameters.arguments.inputDir
        );
        if (attributes != null) {
            uploadOptions.attributes = attributes;
        }

        const response = await Upload.uploadFile(
            session,
            commandParameters.arguments.inputfile,
            commandParameters.arguments.USSFileName,
            uploadOptions
        );

        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }
}
