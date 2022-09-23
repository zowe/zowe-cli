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
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import {CompareBaseHelper} from "../CompareBaseHelper";

/**
 * Handler to compare spooldd's content
 * @export
 */
export default class SpoolddHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const helper = new CompareBaseHelper(commandParameters);
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first spool dd",
            stageName: TaskStage.IN_PROGRESS
        };
        const descriptionSeperator: string = ":";
        commandParameters.response.progress.startBar({ task });
        const spoolDescription1 = commandParameters.arguments.spoolDescription1;

        // retrieving information for first spooldd
        const spoolDescArr1 = spoolDescription1.split(descriptionSeperator);
        const jobName1: string = spoolDescArr1[0];
        const jobId1: string = spoolDescArr1[1];
        const spoolId1: number = Number(spoolDescArr1[2]);
        const spoolContentString1 = await GetJobs.getSpoolContentById(session, jobName1, jobId1, spoolId1);

        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        task.statusMessage = "Retrieving second spooldd";
        // retrieving information for second spooldd
        const spoolDescription2 = commandParameters.arguments.spoolDescription2;
        const spoolDescArr2 = spoolDescription2.split(descriptionSeperator);
        const jobName2: string = spoolDescArr2[0];
        const jobId2: string = spoolDescArr2[1];
        const spoolId2: number = Number(spoolDescArr2[2]);

        const spoolContentString2 = await GetJobs.getSpoolContentById(session, jobName2, jobId2, spoolId2);

        const {contentString1, contentString2} = helper.prepareStrings(spoolContentString1, spoolContentString2);

        return helper.getResponse(contentString1, contentString2);
    }
}
