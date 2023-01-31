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

import * as fs from 'fs';
import * as path from 'path';

import { AbstractSession, IHandlerParameters, ImperativeError, ITaskWithStatus, TaskStage, DiffUtils, IO } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to view a data set's content
 * @export
 */
export default class LocalfileDatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving local file",
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        let localFile: string;

        // resolving to full path if local path passed is not absolute
        if (path.isAbsolute(commandParameters.arguments.localFilePath)) {
            localFile = commandParameters.arguments.localFilePath;
        } else {
            localFile = path.resolve(commandParameters.arguments.localFilePath);
        }

        const localFileHandle = fs.openSync(localFile, 'r');
        let lfContentBuf: Buffer;
        try {
            // check if the path given is of a file or not
            try {
                if (!fs.fstatSync(localFileHandle).isFile()) {
                    throw new ImperativeError({
                        msg: 'Path given is not of a file, do recheck your path again'
                    });
                }
            } catch (error) {
                if (error instanceof ImperativeError) throw error;
                throw new ImperativeError({
                    msg: 'Path not found. Please check the path and try again'
                });
            }

            // reading local file as buffer
            lfContentBuf = fs.readFileSync(localFileHandle);
        } finally {
            fs.closeSync(localFileHandle);
        }

        commandParameters.response.progress.endBar();

        // retrieving the data-set to compare
        commandParameters.response.progress.startBar({ task });
        task.statusMessage = "Retrieving dataset";
        const dsContentBuf = await Get.dataSet(session, commandParameters.arguments.dataSetName,
            {
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                record: commandParameters.arguments.record,
                volume: commandParameters.arguments.volumeSerial,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        let lfContentString = "";
        let dsContentString = "";
        const seqnumlen = 8;

        if(commandParameters.arguments.seqnum === false){
            lfContentString = lfContentBuf.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
            dsContentString = dsContentBuf.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
        }
        else {
            lfContentString = lfContentBuf.toString();
            dsContentString = dsContentBuf.toString();
        }

        //  CHECKING IF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        const browserView = commandParameters.arguments.browserView;
        if (browserView) {

            await DiffUtils.openDiffInbrowser(lfContentString, dsContentString);

            return {
                success: true,
                commandResponse: "Launching local-file and data-set diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextLines;

        jsonDiff = await DiffUtils.getDiffString(IO.processNewlines(lfContentString), IO.processNewlines(dsContentString), {
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
