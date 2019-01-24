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

        const inputdir = path.resolve(commandParameters.arguments.inputdir);

        if(commandParameters.arguments.binary_map) {
            fileNamesString = commandParameters.arguments.binary_map;
        }

        if(commandParameters.arguments.ascii_map) {
            fileNamesString = commandParameters.arguments.ascii_map;
        }

        const fileNamesStringArray = fileNamesString.split(",");

        fileNamesStringArray.forEach(function(element,index): void {
            fileNamesStringArray[index] = element.trim();
        });
        const fileString: IUploadMap = {
            binary: false,
            fileNames : fileNamesStringArray
        };


        const response = await Upload.dirToUSSDir(session, inputdir, commandParameters.arguments.USSDir,
            commandParameters.arguments.binary, commandParameters.arguments.recursive, fileString);
            // commandParameters.arguments.binary_map, commandParameters.arguments.ascii_map);
        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }
}
