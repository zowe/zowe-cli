"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareBaseHelper = void 0;
const path = require("path");
const fs = require("fs");
const imperative_1 = require("@zowe/imperative");
/**
 * Base helper for compare command to handle common operations through the comparison
 * @export
 */
class CompareBaseHelper {
    /**
     * Creates an instance of CompareBaseHelper
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler
     * @memberof CompareBaseHelper
     */
    constructor(commandParameters) {
        var _a;
        /**
         * file compare option for file1
         * @public
         * @memberof CompareBaseHelper
         */
        this.file1Options = {};
        /**
         * file compare option for file2
         * @public
         * @memberof CompareBaseHelper
         */
        this.file2Options = {};
        this.file1Options.binary = commandParameters.arguments.binary;
        this.file2Options.binary = commandParameters.arguments.binary2;
        this.file1Options.encoding = commandParameters.arguments.encoding;
        this.file2Options.encoding = commandParameters.arguments.encoding2;
        this.file1Options.record = commandParameters.arguments.record;
        this.file2Options.record = commandParameters.arguments.record2;
        this.file1Options.volumeSerial = commandParameters.arguments.volumeSerial;
        this.file2Options.volumeSerial = commandParameters.arguments.volumeSerial2;
        if (((_a = this.file2Options) === null || _a === void 0 ? void 0 : _a.binary) == null) {
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
    prepareSpoolDescriptor(spoolDescription) {
        const descriptionSeparator = ":";
        const spoolDescArr = spoolDescription.split(descriptionSeparator);
        const jobName = spoolDescArr[0];
        const jobId = spoolDescArr[1];
        const spoolId = Number(spoolDescArr[2]);
        return { jobName, jobId, spoolId };
    }
    /**
     * Helper function that compare-related handlers will use to get the contents of a local file
     * @param filePath Path to the file to compare against
     * @returns Buffer with the contents of the file
     */
    prepareLocalFile(filePath) {
        const localFile = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
        let lfContentBuf;
        let localFileHandle;
        try {
            try {
                // check if the path given is of a file or not
                localFileHandle = fs.openSync(localFile, 'r');
                if (!fs.fstatSync(localFileHandle).isFile()) {
                    throw new imperative_1.ImperativeError({
                        msg: 'Path is not of a file. Please check the path and try again'
                    });
                }
            }
            catch (error) {
                if (error instanceof imperative_1.ImperativeError)
                    throw error;
                throw new imperative_1.ImperativeError({
                    msg: 'Path not found. Please check the path and try again'
                });
            }
            // reading local file as buffer
            lfContentBuf = fs.readFileSync(localFileHandle);
        }
        finally {
            if (localFileHandle != null)
                fs.closeSync(localFileHandle);
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
    prepareContent(content) {
        let contentString = content.toString();
        if (this.seqnum === false) {
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
    getResponse(string1, string2, options) {
        return __awaiter(this, void 0, void 0, function* () {
            //  CHECKING IF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
            if (this.browserView) {
                yield imperative_1.DiffUtils.openDiffInbrowser(string1, string2, options);
                return {
                    success: true,
                    commandResponse: "Launching data-sets diffs in browser...",
                    apiResponse: {}
                };
            }
            const jsonDiff = yield imperative_1.DiffUtils.getDiffString(string1, string2, {
                outputFormat: 'terminal',
                contextLinesArg: this.contextLines,
                name1: options === null || options === void 0 ? void 0 : options.name1,
                name2: options === null || options === void 0 ? void 0 : options.name2
            });
            return {
                success: true,
                commandResponse: jsonDiff,
                apiResponse: {}
            };
        });
    }
}
exports.CompareBaseHelper = CompareBaseHelper;
//# sourceMappingURL=CompareBaseHelper.js.map