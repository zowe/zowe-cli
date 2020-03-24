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
import { IZosFilesResponse } from "../../../api";
import { Download } from "../../../api/methods/download";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download all members from a pds
 * @export
 */
export default class AllMembersHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const status: ITaskWithStatus = {
            statusMessage: "Downloading all members",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});
        return Download.allMembers(session, commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary,
            directory: commandParameters.arguments.directory,
            extension: commandParameters.arguments.extension,
            maxConcurrentRequests: commandParameters.arguments.maxConcurrentRequests,
            preserveOriginalLetterCase: commandParameters.arguments.preserveOriginalLetterCase,
            task: status
        });
    }
}
