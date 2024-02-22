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

        // Check for file's existence
        try {
            await fs.access(inputFile, fs.constants.F_OK | fs.constants.R_OK);
        } catch (error) {
            throw new Error(`Failed to access the input file: ${inputFile}. Error: ${error.message}`);
        }

        // Then upload existing file
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Uploading to data set",
            stageName: TaskStage.IN_PROGRESS
        };
        commandParameters.response.progress.startBar({task});

        const response = await Upload.fileToDataset(session, inputFile, dataSetName, {
        });

        return response;
    }
}