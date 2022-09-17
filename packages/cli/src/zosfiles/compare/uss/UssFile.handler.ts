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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import CompareBaseHelper from "../CompareBaseHelper";

/**
 * Handler to view a data set's content
 * @export
 */
export default class UssFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const helper = new CompareBaseHelper(commandParameters);
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first uss file",
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const ussFileContentBuf1 = await Get.USSFile(session, commandParameters.arguments.ussFilePath1,
            {
                binary: helper.file1Options.binary,
                encoding: helper.file1Options.encoding,
                responseTimeout: helper.responseTimeout,
                task: task
            }
        );


        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        task.statusMessage = "Retrieving second uss-file";
        const ussFileContentBuf2 = await Get.USSFile(session, commandParameters.arguments.ussFilePath2,
            {
                binary: helper.file2Options.binary,
                encoding: helper.file2Options.encoding,
                responseTimeout: helper.responseTimeout,
                task: task
            }
        );


        const {contentString1, contentString2} =helper.prepareStrings(ussFileContentBuf1, ussFileContentBuf2);
        return helper.getResponse(contentString1, contentString2);
    }
}
