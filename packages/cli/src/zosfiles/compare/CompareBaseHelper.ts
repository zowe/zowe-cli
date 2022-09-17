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

import { IHandlerParameters, DiffUtils } from "@zowe/imperative";
import {  IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ICompareFileOptions } from "./doc/ICompareFileOptions";

/**
 * Base helper for compare command to handle common operations through the comparison
 * @export
 */
export default class CompareBaseHelper {


    /**
     * file compare option for file1
     * @public
     * @memberof CompareBaseHelper
     */
    public file1Options: ICompareFileOptions = {} as ICompareFileOptions;

    /**
     * file compare option for file2
     * @public
     * @memberof CompareBaseHelper
     */
    public file2Options: ICompareFileOptions = {} as ICompareFileOptions;

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
    private contextLines: number;

    /**
     * browserView option
     * @private
     * @memberof CompareBaseHelper
     */
    private  browserView: boolean;

    /**
     * Creates an instance of CompareBaseHelper
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler
     * @memberof CompareBaseHelper
     */
    constructor(commandParameters: IHandlerParameters){
        this.file1Options.binary = commandParameters.arguments.binary;
        this.file2Options.binary = commandParameters.arguments.binary2;
        this.file1Options.encoding = commandParameters.arguments.encoding2;
        this.file2Options.encoding = commandParameters.arguments.encoding2;
        this.file1Options.record = commandParameters.arguments.record2;
        this.file2Options.record = commandParameters.arguments.record2;
        this.file1Options.volumeSerial = commandParameters.arguments.volumeSerial2;
        this.file2Options.volumeSerial = commandParameters.arguments.volumeSerial2;

        if (this.file2Options?.binary == undefined) {
            this.file2Options.binary = this.file1Options.binary;
        }
        if (this.file2Options.encoding == undefined) {
            this.file2Options.encoding = this.file1Options.encoding;
        }
        if (this.file2Options.record == undefined) {
            this.file2Options.record = this.file1Options.record;
        }

        this.seqnum = commandParameters.arguments.seqnum;
        this.browserView = commandParameters.arguments.browserView;
        this.contextLines = commandParameters.arguments.contextLines;
        this.responseTimeout = commandParameters.arguments.responseTimeout;
    }
    /**
     *
     * @param {string | Buffer } content1 - Content string or buffer of file 1
     * @param {string | Buffer } content2 - - Content string or buffer of file 2
     * @returns
     * @public
     * @memberof CompareBaseHelper
     */
    public prepareStrings(content1: string | Buffer, content2: string | Buffer ) {
        let contentString1: string;
        let contentString2: string;

        if(!this.seqnum){
            const seqnumlen = 8;

            const stringArray1 = content1.toString().split("\n");
            for (const i in stringArray1) {
                const sl = stringArray1[i].length;
                const tempString = stringArray1[i].substring(0, sl - seqnumlen);
                contentString1 += tempString + "\n";
            }

            const stringArray2 = content2.toString().split("\n");
            for (const i in stringArray2) {
                const sl = stringArray2[i].length;
                const tempString = stringArray2[i].substring(0, sl - seqnumlen);
                contentString2 += tempString + "\n";
            }
        }
        else {
            contentString1 = content1.toString();
            contentString2 = content2.toString();
        }

        return {
            contentString1, contentString2
        };
    }

    /**
     *
     * @param {string} string1 - string of file 1 comtent
     * @param  {string} string2 - string of file 2 comtent
     * @returns {IZosFilesResponse}
     * @public
     * @memberof CompareBaseHelper
     */
    public async getResponse(string1: string, string2: string): Promise<IZosFilesResponse>{
        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (this.browserView) {

            await DiffUtils.openDiffInbrowser(string1, string2);

            return {
                success: true,
                commandResponse: "Launching data-sets diffs in browser...",
                apiResponse: {}
            };
        }

        let jsonDiff = "";

        jsonDiff = await DiffUtils.getDiffString(string1, string2, {
            outputFormat: 'terminal',
            contextLinesArg: this.contextLines
        });

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
