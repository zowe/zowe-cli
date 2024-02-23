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
import { IZosFilesResponse, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { promises as fs } from 'fs';

/**
 * Handler to upload content of a directory to a PDS
 * @export
 *
 */
export default class DirToPdsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
        session: AbstractSession): Promise<IZosFilesResponse> {

        const inputDir = commandParameters.arguments.inputdir;

        // Check directory existence and accessibility
        await checkDirectoryExistence(inputDir);

        const status: ITaskWithStatus = {
            statusMessage: "Uploading directory to PDS",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task: status});

        const response = await Upload.dirToPds(
            session,
            inputDir,
            commandParameters.arguments.dataSetName,
            {
                volume: commandParameters.arguments.volumeSerial,
                binary: commandParameters.arguments.binary,
                record: commandParameters.arguments.record,
                encoding: commandParameters.arguments.encoding,
                task: status,
                responseTimeout: commandParameters.arguments.responseTimeout
            }
        );

        return response;
    }
}

// Function to check directory existence and accessibility
export async function checkDirectoryExistence(directoryPath: string): Promise<void> {
    try {
        const dirStats = await fs.stat(directoryPath);
        if (!dirStats.isDirectory()) {
            throw new Error(`${directoryPath} is not a directory.`);
        }
    } catch (error) {
        throw new Error(`${error.message}`);
    }
}
