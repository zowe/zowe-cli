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

import * as path from "path";
import * as fs from "fs";
import { IHandlerParameters, DiffUtils, ITaskWithStatus, ImperativeError, IDiffOptions } from "@zowe/imperative";
import {  IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ICompareFileOptions } from "./doc/ICompareFileOptions";

/**
 * Base helper for compare command to handle common operations through the comparison
 * @export
 */
export class CompareBaseHelper {

    /**
     * file compare option for file1
     * @public
     * @memberof CompareBaseHelper
     */
    public file1Options: ICompareFileOptions = {};

    /**
     * file compare option for file2
     * @public
     * @memberof CompareBaseHelper
     */
    public file2Options: ICompareFileOptions = {};

    /**
     * responseTimeout option
     * @public
     * @memberof CompareBaseHelper
     */
    public responseTimeout: number;

    /**
     * seqnum option
     * @public
     * @memberof CompareBaseHelper
     */
    public seqnum: boolean;

    /**
     * contextLines option
     * @private
     * @memberof CompareBaseHelper
     */
    public contextLines: number;

    /**
     * browserView option
     * @private
     * @memberof CompareBaseHelper
     */
    public browserView: boolean;

    /**
     * task
     * @private
     * @memberof CompareBaseHelper
     */
    public task: ITaskWithStatus;

    /**
     * Creates an instance of CompareBaseHelper
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler
     * @memberof CompareBaseHelper
     */
    constructor(commandParameters: IHandlerParameters){
        this.file1Options.binary = commandParameters.arguments.binary;
        this.file2Options.binary = commandParameters.arguments.binary2;
        this.file1Options.encoding = commandParameters.arguments.encoding;
        this.file2Options.encoding = commandParameters.arguments.encoding2;
        this.file1Options.record = commandParameters.arguments.record;
        this.file2Options.record = commandParameters.arguments.record2;
        this.file1Options.volumeSerial = commandParameters.arguments.volumeSerial;
        this.file2Options.volumeSerial = commandParameters.arguments.volumeSerial2;

        if (this.file2Options?.binary == null) {
            this.file2Options.binary = this.file1Options.binary;
        }
        if (this.file2Options.encoding == null) {
            this.file2Options.encoding = this.file1Options.encoding;
        }
        if (this.file2Options.record == null) {
            this.file2Options.record = this.file1Options.record;
        }

        this.seqnum = commandParameters.arguments.seqnum;
        this.browserView = commandParameters.arguments.browserView;
        this.contextLines = commandParameters.arguments.contextLines;
        this.responseTimeout = commandParameters.arguments.responseTimeout;
        this.file1Options.responseTimeout = this.responseTimeout;
        this.file2Options.responseTimeout = this.responseTimeout;

        // Clear undefined properties
        this.file1Options = JSON.parse(JSON.stringify(this.file1Options));
        this.file2Options = JSON.parse(JSON.stringify(this.file2Options));
    }

    /**
     * Parse the spool description and split them into individual properties
     * @param spoolDescription Colon-separated (:) spool descriptor
     * @returns Object containing the name, job id, and spool id
     */
    public prepareSpoolDescriptor(spoolDescription: string): {jobName: string, jobId: string, spoolId: number} {
        const descriptionSeperator: string = ":";
        const spoolDescArr = spoolDescription.split(descriptionSeperator);
        const jobName: string = spoolDescArr[0];
        const jobId: string = spoolDescArr[1];
        const spoolId: number = Number(spoolDescArr[2]);
        return { jobName, jobId, spoolId };
    }

    /**
     * Helper function that compare-related handlers will use to get the contents of a local file
     * @param filePath Path to the file to compare against
     * @returns Buffer with the contents of the file
     */
    public prepareLocalFile(filePath: string): Buffer {
        const localFile = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
        let lfContentBuf: Buffer;
        let localFileHandle: number;
        try {
            try {
                // check if the path given is of a file or not
                localFileHandle = fs.openSync(localFile, 'r');
                if(!fs.fstatSync(localFileHandle).isFile()){
                    throw new ImperativeError({
                        msg: 'Path is not of a file. Please check the path and try again'
                    });
                }
            } catch (error) {
                if (error instanceof ImperativeError) throw error;
                throw new ImperativeError({
                    msg: 'Path not found. Please check the path and try again'
                });
            }
            // reading local file as buffer
            lfContentBuf = fs.readFileSync(localFileHandle);
        } finally {
            if (localFileHandle != null) fs.closeSync(localFileHandle);
        }
        return lfContentBuf;
    }

    /**
     * This method will prepare the strings for comparison ready
     * @param {string | Buffer } content - Content string or buffer of file 1
     * @param {string | Buffer } content2 - - Content string or buffer of file 2
     * @returns
     * @public
     * @memberof CompareBaseHelper
     */
    public prepareContent(content: string | Buffer): string {
        let contentString = content.toString();
        if(this.seqnum === false) {
            const seqnumlen = 8;
            contentString = content.toString().split("\n").map((line) => line.slice(0, -seqnumlen)).join("\n");
        }
        return contentString;
    }

    /**
     * To get the difference string in terminal or in browser
     * @param {string} string1 - string of file 1 content
     * @param {string} string2 - string of file 2 content
     * @param {IDiffOptions} options
     * @returns {IZosFilesResponse}
     * @public
     * @memberof CompareBaseHelper
     */
    public async getResponse(string1: string, string2: string, options?: IDiffOptions): Promise<IZosFilesResponse>{
        //  CHECKING IF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (this.browserView) {
            await DiffUtils.openDiffInbrowser(string1, string2, options);
            return {
                success: true,
                commandResponse: "Launching data-sets diffs in browser...",
                apiResponse: {}
            };
        }

        const jsonDiff = await DiffUtils.getDiffString(string1, string2, {
            outputFormat: 'terminal',
            contextLinesArg: this.contextLines,
            name1: options.name1,
            name2: options.name2
        });

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
