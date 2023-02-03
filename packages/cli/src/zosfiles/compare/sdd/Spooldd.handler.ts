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
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to compare spooldd's content
 * @export
 */
export default class SpoolddHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const descriptionSeperator: string = ":";
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first spool dd",
            stageName: TaskStage.IN_PROGRESS
        };


        // RETRIEVING INFO FOR FIRST SPOOLDD
        commandParameters.response.progress.startBar({ task });
        const spoolDescription1 = commandParameters.arguments.spoolDescription1;
        const spoolDescArr1 = spoolDescription1.split(descriptionSeperator);
        const jobName1: string = spoolDescArr1[0];
        const jobId1: string = spoolDescArr1[1];
        const spoolId1: number = Number(spoolDescArr1[2]);
        let spoolContentString1 = await GetJobs.getSpoolContentById(session, jobName1, jobId1, spoolId1);
        commandParameters.response.progress.endBar();


        // RETRIEVING INFO FOR SECOND SPOOLDD
        task.statusMessage = "Retrieving second spooldd";
        commandParameters.response.progress.startBar({ task });
        const spoolDescription2 = commandParameters.arguments.spoolDescription2;
        const spoolDescArr2 = spoolDescription2.split(descriptionSeperator);
        const jobName2: string = spoolDescArr2[0];
        const jobId2: string = spoolDescArr2[1];
        const spoolId2: number = Number(spoolDescArr2[2]);
        let spoolContentString2 = await GetJobs.getSpoolContentById(session, jobName2, jobId2, spoolId2);
        commandParameters.response.progress.endBar();


        //CHECKING IF NEEDING TO SPLIT CONTENT STRINGS FOR SEQNUM OPTION
        const seqnumlen = 8;
        if(commandParameters.arguments.seqnum === false){
            spoolContentString1 = spoolContentString1.split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
            spoolContentString2 = spoolContentString2.split("\n")
                .map((line)=>line.slice(0,-seqnumlen))
                .join("\n");
        }


        // CHECK TO OPEN UP DIFF IN BROWSER WINDOW
        if (commandParameters.arguments.browserView) {
            await DiffUtils.openDiffInbrowser(spoolContentString1, spoolContentString2);
            return {
                success: true,
                commandResponse: "Launching spool-dds' diffs in browser...",
                apiResponse: {}
            };
        }


        // RETURNING DIFF
        const jsonDiff = await DiffUtils.getDiffString(spoolContentString1, spoolContentString2, {
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
