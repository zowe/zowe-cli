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
import { Upload, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IUploadOptions } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesAttributes } from "@zowe/zos-files-for-zowe-sdk";
import { IUploadMap } from "@zowe/zos-files-for-zowe-sdk";

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
        } else {
            uploadOptions.filesMap = this.buildFilesMap(commandParameters);
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
    private buildFilesMap(commandParameters: IHandlerParameters) {
        let filesMap: IUploadMap = null;

        // checking if binary-files or ascii-files are used, and update filesMap argument
        if (commandParameters.arguments.binaryFiles) {
            filesMap = {
                binary: true,
                fileNames: commandParameters.arguments.binaryFiles
                    .split(",")
                    .map((fileName: string) => fileName.trim()),
            };
        }
        if (commandParameters.arguments.asciiFiles) {
            filesMap = {
                binary: false,
                fileNames: commandParameters.arguments.asciiFiles
                    .split(",")
                    .map((fileName: string) => fileName.trim()),
            };
        }
        return filesMap;
    }
}
