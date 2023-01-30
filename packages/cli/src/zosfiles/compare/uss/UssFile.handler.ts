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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, DiffUtils } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to view a data set's content
 * @export
 */
export default class UssFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first uss file",
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const ussFileContentBuf1 = await Get.USSFile(session, commandParameters.arguments.ussFilePath1,
            {
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        let binary2 = commandParameters.arguments.binary2;
        let encoding2 = commandParameters.arguments.encoding2;
        const browserView = commandParameters.arguments.browserView;

        if (binary2 == undefined) {
            binary2 = commandParameters.arguments.binary;
        }
        if (encoding2 == undefined) {
            encoding2 = commandParameters.arguments.encoding;
        }

        task.statusMessage = "Retrieving second uss-file";
        const ussFileContentBuf2 = await Get.USSFile(session, commandParameters.arguments.ussFilePath2,
            {
                binary: binary2,
                encoding: encoding2,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        let ussContentString1 = "";
        let ussContentString2 = "";
        const seqnumlen = 8;

        if(commandParameters.arguments.seqnum === false){
            ussContentString1 = ussFileContentBuf1.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
            ussContentString2 = ussFileContentBuf2.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
        }
        else {
            ussContentString1 = ussFileContentBuf1.toString();
            ussContentString2 = ussFileContentBuf2.toString();
        }

        // CHECKING IF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {

            await DiffUtils.openDiffInbrowser(ussContentString1, ussContentString2);

            return {
                success: true,
                commandResponse: "Launching uss files diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextLines;

        jsonDiff = await DiffUtils.getDiffString(ussContentString1, ussContentString2, {
            outputFormat: 'terminal',
            contextLinesArg: contextLinesArg
        });

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
