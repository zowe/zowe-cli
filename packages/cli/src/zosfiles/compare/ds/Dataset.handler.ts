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

        if (commandParameters.arguments.noseqnum) {
            const seqnumlen = 8;

            const dsStringArray1 = dsContentBuf1.toString().split("\n");
            for (const i in dsStringArray1) {
                const sl = dsStringArray1[i].length;
                const tempString = dsStringArray1[i].substring(0, sl - seqnumlen);
                dsContentString1 += tempString + "\n";
            }

            const dsStringArray2 = dsContentBuf2.toString().split("\n");
            for (const i in dsStringArray2) {
                const sl = dsStringArray2[i].length;
                const tempString = dsStringArray2[i].substring(0, sl - seqnumlen);
                dsContentString2 += tempString + "\n";
            }
        }
        else {
            dsContentString1 = dsContentBuf1.toString();
            dsContentString2 = dsContentBuf2.toString();
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextlines;

        jsonDiff = await DiffUtils.getDiffString(dsContentString1, dsContentString2, {
            outputFormat: 'terminal',
            contextLinesArg: contextLinesArg
        });

        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {

            await DiffUtils.openDiffInbrowser(dsContentString1, dsContentString2);

            return {
                success: true,
                commandResponse: "Launching data-sets diffs in browser....",
                apiResponse: {}
            };
        }

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
