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

import { AbstractSession, IHandlerParameters, ImperativeError, ITaskWithStatus, TaskStage, DiffUtils } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to compare the local file and uss file's content
 * @export
 */
export default class LocalfileUssHandler extends ZosFilesBaseHandler {
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
        task.statusMessage = "Retrieving uss file";
        const ussContentBuf = await Get.USSFile(session, commandParameters.arguments.ussFilePath,
            {
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );


        const browserView = commandParameters.arguments.browserView;

        let lfContentString = "";
        let ussContentString = "";

        if (!commandParameters.arguments.seqnum) {
            const seqnumlen = 8;

            const lfStringArray = lfContentBuf.toString().split("\n");
            for (const i in lfStringArray) {
                const sl = lfStringArray[i].length;
                const tempString = lfStringArray[i].substring(0, sl - seqnumlen);
                lfContentString += tempString + "\n";
            }

            const ussStringArray = ussContentBuf.toString().split("\n");
            for (const i in ussStringArray) {
                const sl = ussStringArray[i].length;
                const tempString = ussStringArray[i].substring(0, sl - seqnumlen);
                ussContentString += tempString + "\n";
            }
        }
        else {
            lfContentString = lfContentBuf.toString();
            ussContentString = ussContentBuf.toString();
        }

        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {

            await DiffUtils.openDiffInbrowser(lfContentString, ussContentString);

            return {
                success: true,
                commandResponse: "Launching local-filee and uss-file diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextlines;

        jsonDiff = await DiffUtils.getDiffString(lfContentString, ussContentString, {
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
