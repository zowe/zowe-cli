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
import { ISearchOptions, IZosFilesResponse, Search } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to list a data set members
 * @export
 */
export default class DataSetsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Starting search...",
            stageName: TaskStage.NOT_STARTED
        };

        const searchOptions: ISearchOptions = {
            dataSetName: commandParameters.arguments.dataSetName,
            query: commandParameters.arguments.searchString,
            timeout: commandParameters.arguments.timeout,
            mainframeSearch: commandParameters.arguments.mainframeSearch,
            threads: commandParameters.arguments.threads,
            caseSensitive: commandParameters.arguments.caseSensitive,
            progressTask: task
        };

        commandParameters.response.progress.startBar({task});
        const response = await Search.search(session, searchOptions);
        commandParameters.response.progress.endBar();

        return response;
    }
}
