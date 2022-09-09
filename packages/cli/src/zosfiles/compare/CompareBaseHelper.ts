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

/**
 * Base helper for compare command to handle common operations through the comparison
 * @export
 */
export default class ComapareBaseHelper {

    /**
     * Singleton instance of this class
     * @public
     * @static
     * @type {ComapareBaseHelper}
     * @memberof ComapareBaseHelper
     */
    private static hInstance: ComapareBaseHelper;

    /**
     * Return a singleton instance of this class
     * @static
     * @readonly
     */
    public static get instance(): ComapareBaseHelper {
        if(this.hInstance == null){
            this.hInstance = new ComapareBaseHelper();
        }

        return this.hInstance;
    }

    /**
     * binary option for file1
     * @public
     * @memberof ComapareBaseHelper
     */
    public binary: boolean;

    /**
     * encoding option for file1
     * @public
     * @memberof ComapareBaseHelper
     */
    public encoding: string;

    /**
     * record option for file1
     * @public
     * @memberof ComapareBaseHelper
     */
    public record: boolean;

    /**
     * volume serial option for file
     * @public
     * @memberof ComapareBaseHelper
     */
    public volumeSerial: string;

    /**
     * responseTimeout option
     * @public
     * @memberof ComapareBaseHelper
     */
    public responseTimeout: number;

    /**
     * binary option for file2
     * @public
     * @memberof ComapareBaseHelper
     */
    public binary2: boolean;

    /**
     * encoding option for file1
     * @public
     * @memberof ComapareBaseHelper
     */
    public encoding2: string;

    /**
     * record option for file2
     * @public
     * @memberof ComapareBaseHelper
     */
    public record2: boolean;

    /**
     * volume serial option for file2
     * @public
     * @memberof ComapareBaseHelper
     */
    public volumeSerial2: string;

    /**
     * seqnum option
     * @public
     * @memberof ComapareBaseHelper
     */
    public seqnum: boolean;

    /**
     * contextLines option
     * @private
     * @memberof ComapareBaseHelper
     */
    private contextLines: number;

    /**
     * browserView option
     * @private
     * @memberof ComapareBaseHelper
     */
    private  browserView: boolean;

    /**
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     * @public
     * @memberof ComapareBaseHelper
     */
    public async setComparisonEnvironment(commandParameters: IHandlerParameters): Promise<void> {

        this.binary = commandParameters.arguments.binary;
        this.binary2 = commandParameters.arguments.binary2;
        this.encoding2 = commandParameters.arguments.encoding2;
        this.encoding2 = commandParameters.arguments.encoding2;
        this.record2 = commandParameters.arguments.record2;
        this.record2 = commandParameters.arguments.record2;
        this.volumeSerial2 = commandParameters.arguments.volumeSerial2;
        this.volumeSerial2 = commandParameters.arguments.volumeSerial2;

        if (this.binary2 == undefined) {
            this.binary2 = this.binary;
        }
        if (this.encoding2 == undefined) {
            this.encoding2 = this.encoding;
        }
        if (this.record2 == undefined) {
            this.record2 = this.record;
        }

    }

    /**
     *
     * @param {string | Buffer } content1 - Content string or buffer of file 1
     * @param {string | Buffer } content2 - - Content string or buffer of file 2
     * @returns
     * @public
     * @memberof ComapareBaseHelper
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
     * @param {boolean} browserView
     * @param {number} contextlinesArg
     * @returns
     * @public
     * @memberof ComapareBaseHelper
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
