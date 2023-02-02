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

import * as path from "path";
import * as fs from "fs";
import { AbstractSession, IHandlerParameters, ITaskWithStatus, ImperativeError, TaskStage, DiffUtils } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to compare spooldd's content
 * @export
 */

export default class LocalfileSpoolddHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const descriptionSeperator: string = ":";
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving local file",
            stageName: TaskStage.IN_PROGRESS
        };


        // CHECKING IF LOCAL FILE EXISTS, THEN RETRIEVING IT
        commandParameters.response.progress.startBar({ task });
        let localFile: string;
        if (path.isAbsolute(commandParameters.arguments.localFilePath)) {
            // resolving to full path if local path passed is not absolute
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


        // RETRIEVING SPOOLDD
        task.statusMessage = "Retrieving spooldd";
        commandParameters.response.progress.startBar({ task });
        const spoolDescription = commandParameters.arguments.spoolDescription;
        const spoolDescArr = spoolDescription.split(descriptionSeperator);
        const jobName: string = spoolDescArr[0];
        const jobId: string = spoolDescArr[1];
        const spoolId: number = Number(spoolDescArr[2]);
        let spoolContentString = await GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
        commandParameters.response.progress.endBar();


        //CHECKING IF NEEDING TO SPLIT CONTENT STRINGS FOR SEQNUM OPTION
        let lfContentString: string = "";
        const seqnumlen = 8;
        if(commandParameters.arguments.seqnum === false){
            lfContentString = lfContentBuf.toString().split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
            spoolContentString = spoolContentString.split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
        }
        else {
            lfContentString = lfContentBuf.toString();
        }


        // CHECK TO OPEN UP DIFF IN BROWSER WINDOW
        if (commandParameters.arguments.browserView) {
            await DiffUtils.openDiffInbrowser(lfContentString, spoolContentString);
            return {
                success: true,
                commandResponse: "Launching local-file and spool-dd diffs in browser...",
                apiResponse: {}
            };
        }

        
        // RETURNING DIFF
        let jsonDiff = await DiffUtils.getDiffString(lfContentString, spoolContentString, {
            outputFormat: 'terminal',
            contextLinesArg: commandParameters.arguments.contextLines
        });
        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}