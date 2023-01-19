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

        // check if the path given is of a file or not
        try {
            if(!fs.lstatSync(localFile).isFile()){
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
        const lfContentBuf = fs.readFileSync(localFile);

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


        const browserView = commandParameters.arguments.browserView;

        let lfContentString = "";
        let dsContentString = "";

        if (!commandParameters.arguments.seqnum) {
            const seqnumlen = 8;

            const lfStringArray = lfContentBuf.toString().split("\n");
            for (const i in lfStringArray) {
                const sl = lfStringArray[i].length;
                const tempString = lfStringArray[i].substring(0, sl - seqnumlen);
                lfContentString += tempString + "\n";
            }

            const dsStringArray = dsContentBuf.toString().split("\n");
            for (const i in dsStringArray) {
                const sl = dsStringArray[i].length;
                const tempString = dsStringArray[i].substring(0, sl - seqnumlen);
                dsContentString += tempString + "\n";
            }
        }
        else {
            lfContentString = lfContentBuf.toString();
            dsContentString = dsContentBuf.toString();
        }

        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
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

        //remove all line break encodings from strings
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
