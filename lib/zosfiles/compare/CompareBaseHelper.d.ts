/// <reference types="node" />
import { IHandlerParameters, ITaskWithStatus, IDiffOptions, IDiffNameOptions } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ICompareFileOptions } from "./doc/ICompareFileOptions";
/**
 * Base helper for compare command to handle common operations through the comparison
 * @export
 */
export declare class CompareBaseHelper {
    /**
     * file compare option for file1
     * @public
     * @memberof CompareBaseHelper
     */
    file1Options: ICompareFileOptions;
    /**
     * file compare option for file2
     * @public
     * @memberof CompareBaseHelper
     */
    file2Options: ICompareFileOptions;
    /**
     * responseTimeout option
     * @public
     * @memberof CompareBaseHelper
     */
    responseTimeout: number;
    /**
     * seqnum option
     * @public
     * @memberof CompareBaseHelper
     */
    seqnum: boolean;
    /**
     * contextLines option
     * @private
     * @memberof CompareBaseHelper
     */
    contextLines: number;
    /**
     * browserView option
     * @private
     * @memberof CompareBaseHelper
     */
    browserView: boolean;
    /**
     * task
     * @private
     * @memberof CompareBaseHelper
     */
    task: ITaskWithStatus;
    /**
     * Creates an instance of CompareBaseHelper
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler
     * @memberof CompareBaseHelper
     */
    constructor(commandParameters: IHandlerParameters);
    /**
     * Parse the spool description and split them into individual properties
     * @param spoolDescription Colon-separated (:) spool descriptor
     * @returns Object containing the name, job id, and spool id
     */
    prepareSpoolDescriptor(spoolDescription: string): {
        jobName: string;
        jobId: string;
        spoolId: number;
    };
    /**
     * Helper function that compare-related handlers will use to get the contents of a local file
     * @param filePath Path to the file to compare against
     * @returns Buffer with the contents of the file
     */
    prepareLocalFile(filePath: string): Buffer;
    /**
     * This method will prepare the strings for comparison ready
     * @param {string | Buffer } content - Content string or buffer of file 1
     * @param {string | Buffer } content2 - - Content string or buffer of file 2
     * @returns
     * @public
     * @memberof CompareBaseHelper
     */
    prepareContent(content: string | Buffer): string;
    /**
     * To get the difference string in terminal or in browser
     * @param {string} string1 - string of file 1 content
     * @param {string} string2 - string of file 2 content
     * @param {IDiffOptions} options
     * @returns {IZosFilesResponse}
     * @public
     * @memberof CompareBaseHelper
     */
    getResponse(string1: string, string2: string, options?: IDiffOptions | IDiffNameOptions): Promise<IZosFilesResponse>;
}
