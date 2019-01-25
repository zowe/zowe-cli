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
import { IUploadMap } from "../../../api/methods/upload/doc/IUploadMap";

/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */

export default class DirToUSSDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {
        const status: ITaskWithStatus = {
            statusMessage: "Uploading directory to USS",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});

        // resolving to full path before passing to specific Upload function
        const inputdir = path.resolve(commandParameters.arguments.inputdir);

        // build filesMap argument
        let filesMap: IUploadMap = null;

        // checking if binary-files or ascii-files are used, and update filesMap argument
        if(commandParameters.arguments.binary_files) {
            filesMap = {
                binary : true,
                fileNames : commandParameters.arguments.binary_files.split(",").forEach((element: string,index: number) =>{
                    filesMap.fileNames[index] = element.trim();
                }),
            };
        }
        if(commandParameters.arguments.ascii_files) {
            filesMap = {
                binary : false,
                fileNames : commandParameters.arguments.ascii_files.split(",").forEach((element: string,index: number) =>{
                    filesMap.fileNames[index] = element.trim();
                }),
            };
        }
        commandParameters.response.console.log(inputdir);
        commandParameters.response.console.log(commandParameters.arguments.USSDir);
        commandParameters.response.console.log(commandParameters.arguments.recursive);
        commandParameters.response.console.log(commandParameters.arguments.binary_files.toString());
        commandParameters.response.console.log(filesMap.fileNames.toString());
        commandParameters.response.console.log(filesMap.binary.toString());

        const response = await Upload.dirToUSSDir(session, inputdir, commandParameters.arguments.USSDir,
            commandParameters.arguments.binary, commandParameters.arguments.recursive, filesMap);
        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }
}
