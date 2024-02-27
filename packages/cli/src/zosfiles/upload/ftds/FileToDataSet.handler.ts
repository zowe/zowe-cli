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
 * Handler to upload content from a file to a data set
 * @export
 */
export default class FileToDataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
        session: AbstractSession): Promise<IZosFilesResponse> {

        const inputFile = commandParameters.arguments.inputfile;
        const dataSetName = commandParameters.arguments.dataSetName;
        const status: ITaskWithStatus = {
            statusMessage: "Uploading to data set",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };

        try {
            // Check for file's existence and accessibility
            await this.checkFileExistence(inputFile);

            commandParameters.response.progress.startBar({task: status});

            const response = await Upload.fileToDataset(
                session,
                inputFile,
                dataSetName,
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
        } catch (error) {
            // Handle errors from directory check or upload
            status.statusMessage = "Error during upload";
            commandParameters.response.console.error(`Error: ${error.message}`);
            throw new Error(error.message);
        } finally {
            // Clean up
            commandParameters.response.progress.endBar();
        }
    }

    /**
     * Checks if the specified file exists and is accessible
     * @param filePath - Path to the file to check
     * @returns Promise<void>
     */
    private async checkFileExistence(filePath: string): Promise<void> {
        try {
            await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        } catch (error) {
            throw new Error(`File does not exist or is not accessible: ${filePath}`);
        }
    }
}