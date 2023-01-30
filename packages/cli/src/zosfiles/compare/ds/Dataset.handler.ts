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
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first dataset",
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const dsContentBuf1 = await Get.dataSet(session, commandParameters.arguments.dataSetName1,
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
        const browserView = commandParameters.arguments.browserView;
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

        task.statusMessage = "Retrieving second dataset";
        const dsContentBuf2 = await Get.dataSet(session, commandParameters.arguments.dataSetName2,
            {
                binary: binary2,
                encoding: encoding2,
                record: record2,
                volume: volumeSerial2,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        let dsContentString1 = "";
        let dsContentString2 = "";
        const seqnumlen = 8;

        if(commandParameters.arguments.seqnum === false){
            dsContentString1 = dsContentBuf1.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
            dsContentString2 = dsContentBuf2.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
        }
        else {
            dsContentString1 = dsContentBuf1.toString();
            dsContentString2 = dsContentBuf2.toString();
        }

        //  CHECKING IF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {

            await DiffUtils.openDiffInbrowser(dsContentString1, dsContentString2);

            return {
                success: true,
                commandResponse: "Launching data-sets diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLines = commandParameters.arguments.contextLines;

        jsonDiff = await DiffUtils.getDiffString(dsContentString1, dsContentString2, {
            outputFormat: 'terminal',
            contextLinesArg: contextLines
        });

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
