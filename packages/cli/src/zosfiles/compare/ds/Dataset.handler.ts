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
import {CompareBaseHelper} from '../CompareBaseHelper';
/**
 * Handler to view a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const helper = new CompareBaseHelper(commandParameters);
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: `Retrieving first dataset`,
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const dsContentBuf1 = await Get.dataSet(session, commandParameters.arguments.dataSetName1,
            {
                ...helper.file1Options,
                responseTimeout: helper.responseTimeout,
                task: task
            }
        );
        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        task.statusMessage = `Retrieving second dataset`;
        const dsContentBuf2 = await Get.dataSet(session, commandParameters.arguments.dataSetName2,
            {
                ...helper.file2Options,
                responseTimeout: helper.responseTimeout,
                task: task
            }
        );

        const {contentString1, contentString2} = helper.prepareStrings(dsContentBuf1, dsContentBuf2);

        return helper.getResponse(contentString1, contentString2);
    }
}
