/* eslint-disable no-console */
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
import { DiffUtils } from "@zowe/imperative";
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
                record: commandParameters.arguments.record,
                volume: commandParameters.arguments.volumeSerial,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );


        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        let binary2 = commandParameters.arguments.binary2;
        let encoding2 = commandParameters.arguments.encoding2;
        let record2 = commandParameters.arguments.record2;
        const browserView = commandParameters.arguments.browserview;
        const volumeSerial2 = commandParameters.arguments.volumeSerial2;

        if (binary2 == undefined) {
            binary2 = commandParameters.arguments.binary;
        }
        if (encoding2 == undefined) {
            encoding2 = commandParameters.arguments.encoding;
        }
        if (record2 == undefined) {
            record2 = commandParameters.arguments.record;
        }

        task.statusMessage = "Retrieving second uss-file";
        const ussFileContentBuf2 = await Get.USSFile(session, commandParameters.arguments.ussFilePath2,
            {
                binary: binary2,
                encoding: encoding2,
                record: record2,
                volume: volumeSerial2,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        let ussContentString1 = "";
        let ussContentString2 = "";

        if(commandParameters.arguments.seqnum == false){
            const seqnumlen = 8;

            const ussFileStringArray1 = ussFileContentBuf1.toString().split("\n");
            for (const i in ussFileStringArray1) {
                const sl = ussFileStringArray1[i].length;
                const tempString = ussFileStringArray1[i].substring(0, sl - seqnumlen);
                ussContentString1 += tempString + "\n";
            }

            const ussFileStringArray2 = ussFileContentBuf2.toString().split("\n");
            for (const i in ussFileStringArray2) {
                const sl = ussFileStringArray2[i].length;
                const tempString = ussFileStringArray2[i].substring(0, sl - seqnumlen);
                ussContentString2 += tempString + "\n";
            }
        }
        else {
            ussContentString1 = ussFileContentBuf1.toString();
            ussContentString2 = ussFileContentBuf2.toString();
        }

        //  CHECHKING IsetsF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {

            await DiffUtils.openDiffInbrowser(ussContentString1, ussContentString2);

            return {
                success: true,
                commandResponse: "Launching uss files diffs in browser....",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextlines;

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
