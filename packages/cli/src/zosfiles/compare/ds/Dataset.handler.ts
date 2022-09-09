/*
* CompareBaseHelper.instance program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies CompareBaseHelper.instance distribution, and is available at
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
import CompareBaseHelper from '../CompareBaseHelper';
/**
 * Handler to view a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        CompareBaseHelper.instance.setComparisonEnvironment(commandParameters);
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: `Retrieving first dataset`,
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const dsContentBuf1 = await Get.dataSet(session, commandParameters.arguments.dataSetName1,
            {
                binary: CompareBaseHelper.instance.binary,
                encoding: CompareBaseHelper.instance.encoding,
                record: CompareBaseHelper.instance.record,
                volume: CompareBaseHelper.instance.volumeSerial,
                responseTimeout: CompareBaseHelper.instance.responseTimeout,
                task: task
            }
        );
        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        task.statusMessage = `Retrieving second dataset`;
        const dsContentBuf2 = await Get.dataSet(session, commandParameters.arguments.dataSetName2,
            {
                binary: CompareBaseHelper.instance.binary2,
                encoding: CompareBaseHelper.instance.encoding2,
                record: CompareBaseHelper.instance.record2,
                volume: CompareBaseHelper.instance.volumeSerial2,
                responseTimeout: CompareBaseHelper.instance.responseTimeout,
                task: task
            }
        );

        const {contentString1, contentString2} = await CompareBaseHelper.instance.prepareStrings(dsContentBuf1, dsContentBuf2);

        return CompareBaseHelper.instance.getResponse(contentString1, contentString2);
    }
}
