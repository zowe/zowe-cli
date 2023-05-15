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

import { AbstractSession, IHandlerParameters, TextUtils, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { IZosFilesResponse, ZosFilesAttributes, Upload, IUploadMap, IUploadOptions } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import * as path from "path";

/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */

export default class DirToUSSDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
        session: AbstractSession): Promise<IZosFilesResponse> {

        const status: ITaskWithStatus = {
            statusMessage: "Uploading all files",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };

        let inputDir: string;

        // resolving to full path if local path passed is not absolute
        if (path.isAbsolute(commandParameters.arguments.inputDir)) {
            inputDir = commandParameters.arguments.inputDir;
        } else {
            inputDir = path.resolve(commandParameters.arguments.inputDir);
        }

        const uploadOptions: IUploadOptions = {
            binary: commandParameters.arguments.binary,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            task: status,
            responseTimeout: commandParameters.arguments.responseTimeout,
            includeHidden: commandParameters.arguments.includeHidden
        };

        const attributes = ZosFilesAttributes.loadFromFile(commandParameters.arguments.attributes, inputDir);
        if (attributes != null) {
            uploadOptions.attributes = attributes;
        } else {
            uploadOptions.filesMap = this.buildFilesMap(commandParameters);
        }

        const uploadApi = commandParameters.arguments.recursive ? Upload.dirToUSSDirRecursive : Upload.dirToUSSDir;
        const response = await uploadApi.bind(Upload)(session, inputDir, commandParameters.arguments.USSDir, uploadOptions);

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
                fileNames: commandParameters.arguments.binaryFiles.split(",").map((fileName: string) => fileName.trim())
            };
        }
        if (commandParameters.arguments.asciiFiles) {
            filesMap = {
                binary: false,
                fileNames: commandParameters.arguments.asciiFiles.split(",").map((fileName: string) => fileName.trim())
            };
        }
        return filesMap;
    }
}
