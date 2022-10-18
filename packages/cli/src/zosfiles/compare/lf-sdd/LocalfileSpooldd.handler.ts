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
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving local file",
            stageName: TaskStage.IN_PROGRESS
        };
        const descriptionSeperator: string = ":";
        commandParameters.response.progress.startBar({ task });

        // retrieving local file
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

        const lfContentBuf = fs.readFileSync(localFile);

        let lfContentString: string = "";
        if (!commandParameters.arguments.seqnum) {
            const seqnumlen = 8;

            const lfStringArray = lfContentBuf.toString().split("\n");
            for (const i in lfStringArray) {
                const sl = lfStringArray[i].length;
                const tempString = lfStringArray[i].substring(0, sl - seqnumlen);
                lfContentString += tempString + "\n";
            }
        }else{
            lfContentString = lfContentBuf.toString();
        }

        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        task.statusMessage = "Retrieving spooldd";
        // retrieving information for  spooldd
        const spoolDescription = commandParameters.arguments.spoolDescription;
        const spoolDescArr = spoolDescription.split(descriptionSeperator);
        const jobName: string = spoolDescArr[0];
        const jobId: string = spoolDescArr[1];
        const spoolId: number = Number(spoolDescArr[2]);

        const spoolContentString = await GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);


        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (commandParameters.arguments.browserView) {

            await DiffUtils.openDiffInbrowser(lfContentString, spoolContentString);

            return {
                success: true,
                commandResponse: "Launching local-file and spool-dd diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";
        const contextLinesArg = commandParameters.arguments.contextlines;

        jsonDiff = await DiffUtils.getDiffString(lfContentString, spoolContentString, {
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
