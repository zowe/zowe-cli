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

import { AbstractSession, IHandlerParameters, TextUtils, ITaskWithStatus, TaskStage, ImperativeError } from "@zowe/imperative";
import { Upload } from "../../../../../../packages/zosfiles/src/methods/upload";
import { IZosFilesResponse, ZosFilesAttributes, ZosFilesMessages } from "../../../../../../packages/zosfiles/src";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import * as path from "path";
import * as fs from "fs";
import { IUploadMap } from "../../../../../../packages/zosfiles/src/methods/upload/doc/IUploadMap";

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

        let response;
        const attributesFile = this.findAttributesFile(commandParameters, inputDir);

        if (attributesFile) {
            response  = await this.uploadWithAttributesFile
                 (attributesFile, response, session, inputDir, commandParameters, status);
        } else {
            const filesMap: IUploadMap = this.buildFilesMap(commandParameters);

            if(commandParameters.arguments.recursive) {
                response = await Upload.dirToUSSDirRecursive(session,
                    inputDir,
                    commandParameters.arguments.USSDir, {
                        binary: commandParameters.arguments.binary,
                        filesMap,
                        maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                        task: status,
                        responseTimeout: commandParameters.arguments.responseTimeout
                    });
            } else {
                response = await Upload.dirToUSSDir(session,
                    inputDir,
                    commandParameters.arguments.USSDir, {
                        binary: commandParameters.arguments.binary,
                        filesMap,
                        maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                        task: status,
                        responseTimeout: commandParameters.arguments.responseTimeout
                    });
            }
        }

        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }

    private findAttributesFile(commandParameters: IHandlerParameters, inputDir: string) {
        let attributesFile;
        if (commandParameters.arguments.attributes) {
            if (!fs.existsSync(commandParameters.arguments.attributes)) {
                throw new ImperativeError({ msg: TextUtils.formatMessage(ZosFilesMessages.attributesFileNotFound.message,
                    {file: commandParameters.arguments.attributes})});
            }
            attributesFile = commandParameters.arguments.attributes;
        }
        else {
            const localAttributesFile = path.join(inputDir, ".zosattributes");
            if (fs.existsSync(localAttributesFile)) {
                attributesFile = localAttributesFile;
            }
        }
        return attributesFile;
    }

    private async uploadWithAttributesFile(attributesFile: any,
                                           response: any,
                                           session: AbstractSession,
                                           inputDir: string,
                                           commandParameters: IHandlerParameters,
                                           status: ITaskWithStatus) {
        let attributesFileContents;
        try {
            attributesFileContents = fs.readFileSync(attributesFile).toString();
        }
        catch (err) {
            throw new ImperativeError({ msg: TextUtils.formatMessage(
                ZosFilesMessages.errorReadingAttributesFile.message,
                {file: attributesFile, message: err.message})});
        }
        let attributes;
        try {
            attributes = new ZosFilesAttributes(attributesFileContents,inputDir);
        }
        catch (err) {
            throw new ImperativeError({ msg: TextUtils.formatMessage(
                ZosFilesMessages.errorParsingAttributesFile.message,
                {file: attributesFile, message: err.message})});
        }

        if(commandParameters.arguments.recursive) {
            response = await Upload.dirToUSSDirRecursive(session,
                inputDir,
                commandParameters.arguments.USSDir, {
                    attributes,
                    maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                    task: status,
                    responseTimeout: commandParameters.arguments.responseTimeout
                });
        } else {
            response = await Upload.dirToUSSDir(session,
                inputDir,
                commandParameters.arguments.USSDir, {
                    attributes,
                    maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
                    task: status,
                    responseTimeout: commandParameters.arguments.responseTimeout
                });
        }

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
