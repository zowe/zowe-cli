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
export default class AllMembersHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const filesResponse: IZosFilesResponse = {
            success: false,
            commandResponse: undefined,
            apiResponse: undefined,
            errorMessage: undefined
        };

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

        let message = "Found \"" + commandParameters.arguments.searchString + "\" in " + response.length + " data sets and PDS members:\n";
        for (const resp of response) {
            message += "\nData Set \"" + resp.dsname + "\"";

            if (resp.memname) { message += " | Member \"" + resp.memname + "\":\n"; }
            else { message += ":\n"; }

            for (const {line, column, contents} of resp.matchList) {
                message += "Line: " + line + ", Column: " + column + ", Contents: " + contents + "\n";
            }
        }
        filesResponse.success = true;
        filesResponse.commandResponse = message;
        filesResponse.apiResponse = response;
        return filesResponse;
    }
}
