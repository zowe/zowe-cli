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
        const status: ITaskWithStatus = {
            statusMessage: "Uploading directory to PDS",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };

        try {
            // Check directory existence and accessibility
            await this.checkDirectoryExistence(inputDir);

            status.statusMessage = "Uploading directory to PDS";
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
            status.statusMessage = "Upload complete";
            status.percentComplete = 100;
            return response;
        } catch (error) {
            // Handle errors from directory check or upload
            status.statusMessage = "Error during upload";
            commandParameters.response.console.error(`Error: ${error.message}`);
            return {
                success: false,
                commandResponse: `Failed to upload directory to PDS: ${error.message}`
            };
        } finally {
            // Clean up or finalize tasks, such as ending a progress bar
            commandParameters.response.progress.endBar();
        }
    }


    /**
     * Checks if the specified directory exists and is accessible
     * @param directoryPath - Path to the directory to check
     * @returns Promise<void>
     */
    private async checkDirectoryExistence(directoryPath: string): Promise<void> {
        const dirStats = await fs.stat(directoryPath);
        if (!dirStats.isDirectory()) {
            throw new Error(`${directoryPath} is not a directory.`);
        }
    }
}
