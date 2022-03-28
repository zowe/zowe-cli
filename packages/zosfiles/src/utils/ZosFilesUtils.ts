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
import { IO, Logger, IHeaderContent, AbstractSession, ImperativeExpect, Headers } from "@zowe/imperative";
import { ZosFilesConstants } from "../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../doc/IZosFilesResponse";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { IDeleteOptions } from "../methods/hDelete";
import { IOptions } from "../doc/IOptions";

/**
 * Common IO utilities
 */
export class ZosFilesUtils {
    /**
     * Data set name qualifier separator
     * @type {string}
     */
    public static readonly DSN_SEP: string = ".";

    /**
     * Default file extension
     * @type {string}
     */
    public static readonly DEFAULT_FILE_EXTENSION: string = "txt";

    public static readonly MAX_MEMBER_LENGTH: number = 8;

    /**
     * Break up a dataset name of either:
     *  USER.WORK.JCL(TEMPLATE) to user/work/jcl/template
     * Or:
     *  USER.WORK.PS to user/work/ps
     * @param  {string} dataSet - data set to break up into folders
     */
    public static getDirsFromDataSet(dataSet: string) {
        let localDirectory = dataSet.replace(new RegExp(`\\${this.DSN_SEP}`, "g"), IO.FILE_DELIM).toLowerCase();
        if (localDirectory.indexOf("(") >= 0 && localDirectory.indexOf(")") >= 0) {
            localDirectory = localDirectory.replace(/\(/, IO.FILE_DELIM);
            localDirectory = localDirectory.slice(0, -1);
        }
        return localDirectory;
    }


    /**
     * Get fullpath name from input path.
     * @param {string} inputPath - input path
     * @return {string} full path version of the input path
     */
    public static getFullPath(inputPath: string) {
        let fullPath = path.normalize(inputPath);

        if (fullPath.indexOf(":\\") !== -1 || fullPath.indexOf("/") === 0) {
            fullPath = path.normalize(fullPath);
        } else {
            fullPath = path.resolve(process.cwd(), fullPath);
        }

        return fullPath;
    }

    /**
     * Return an array contain the list of all files in the input path. It does not trevor to
     * directory in the input path.
     * @param {string}  inputPath input path to gather file list
     * @param {boolean} [inFullPathFormat=true] is the return file path in full path mode flag
     * @param {boolean} [isIgnoreHidden=true] is listing hidden files flag
     * @return {string[]} Array of all files finds in path
     */
    public static getFileListFromPath(inputPath: string,
        inFullPathFormat: boolean = true,
        isIgnoreHidden: boolean = true): string[] {
        const returnFileList: string[] = [];

        const fullpath = this.getFullPath(inputPath);
        if (IO.isDir(fullpath)) {
            const fileList = fs.readdirSync(fullpath);
            fileList.forEach((file) => {
                const tempPath = path.resolve(fullpath, file);
                if (fs.lstatSync(tempPath).isFile()) {
                    if (!(isIgnoreHidden && path.basename(file).startsWith("."))) {
                        if (inFullPathFormat) {
                            returnFileList.push(tempPath);
                        } else {
                            returnFileList.push(file);
                        }
                    }
                }
            });
        } else if (fs.lstatSync(fullpath).isFile()) {
            if (inFullPathFormat) {
                returnFileList.push(fullpath);
            } else {
                returnFileList.push(inputPath);
            }
        } else {
            // todo add handler for symplink here
        }

        return returnFileList;
    }

    /**
     * Common method to build headers given input options object
     * @private
     * @static
     * @param {IOptions} options - various options
     * @returns {IHeaderContent[]}
     * @memberof ZosFilesUtils
     */
    public static generateHeadersBasedOnOptions(options: IOptions): IHeaderContent[] {
        const reqHeaders: IHeaderContent[] = [];

        if (options.binary) {
            reqHeaders.push(ZosmfHeaders.X_IBM_BINARY);
        } else if (options.record) {
            reqHeaders.push(ZosmfHeaders.X_IBM_RECORD);
        } else if (options.encoding) {

            const keys: string[] = Object.keys(ZosmfHeaders.X_IBM_TEXT);
            const value = ZosmfHeaders.X_IBM_TEXT[keys[0]] + ZosmfHeaders.X_IBM_TEXT_ENCODING + options.encoding;
            const header: any = Object.create(ZosmfHeaders.X_IBM_TEXT);
            header[keys[0]] = value;
            reqHeaders.push(header);

        } else {
            // do nothing
        }

        // TODO:gzip Always accept encoding after z/OSMF truncating gzipped binary data is fixed
        // See https://github.com/zowe/zowe-cli/issues/1170
        if (!options.binary && !options.record) {
            reqHeaders.push(ZosmfHeaders.ACCEPT_ENCODING);
        }

        if (options.responseTimeout != null) {
            reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }

        return reqHeaders;
    }

    /**
     * Generate member name from input string base on IBM specification
     * @param {string} fileName input name used to generate member name with
     * @return {string} generated member name
     */
    public static generateMemberName(fileName: string) {
        let memberName = path.basename(fileName).toUpperCase();

        // Remove extention
        memberName = memberName.replace(path.extname(memberName), "");

        // First character must be either a letter or #, @, $.
        memberName = memberName.replace(/[^A-Z0-9@#$]/g, "");

        // Member also does not allow to start with a number
        memberName = memberName.replace(/[\d]/gy, "");

        // Trunkage lenght to max lenght allowed
        memberName = memberName.substr(0, this.MAX_MEMBER_LENGTH);

        return memberName;
    }

    /**
     * Check if the input data set name contain masking characters
     * @param {string} dataSetName input data set name to be checked
     * @return {boolean} status if data set name contain masking characters
     */
    public static isDataSetNameContainMasking(dataSetName: string): boolean {
        let returnStatus = false;

        if (dataSetName.match(/[*%]/g)) {
            returnStatus = true;
        }

        return returnStatus;
    }

    /**
     * Normalize all Windows newline to Unix newline
     * @param {Buffer} buffer data to convert
     * @return {Buffer} converted data
     */
    public static normalizeNewline(buffer: Buffer): Buffer {
        return Buffer.from(buffer.toString().replace(/\r\n/g, "\n"));
    }

    /**
     * Normanize and URL-encode a USS path to be passed to z/OSMF
     * @param ussPath path to sanitize
     */
    public static sanitizeUssPathForRestCall(ussPath: string): string {
        let sanitizedPath = path.posix.normalize(ussPath);
        if (sanitizedPath.charAt(0) === "/") {
            // trim leading slash from unix files - API doesn't like it
            sanitizedPath = sanitizedPath.substring(1);
        }
        return encodeURIComponent(sanitizedPath);
    }

    /**
     * Format USS filepaths in the way that the APIs expect (no leading /)
     * @param {string} usspath - the path to format
     */
    public static formatUnixFilepath(usspath: string) {
        if (usspath.charAt(0) === "/") {
            // trim leading slash from unix files - API doesn't like it
            usspath = usspath.substring(1);
        }
        return usspath;
    }

    /**
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} dataSetName -The name of the data set to recall|migrate|delete
     * @param {string} returnMessage - Message to return based upon command request
     * @param {any} hsmCommand - HsmCommand requested
     * @param {IRecallOptions | IMigrateOptions | IDeleteOptions} options
     * * - If true then the function waits for completion of the request. If false (default) the request is queued.
     */
    public static async dfsmsHsmCommand(
        session: AbstractSession,
        dataSetName: string,
        returnMessage: string,
        hsmCommand: any,
        options: Partial<IDeleteOptions> = {}
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const payload = hsmCommand;

            if (options.wait != null) {
                payload.wait = options.wait;
            }

            if (options.purge != null) {
                payload.purge = options.purge;
            }

            const headers: IHeaderContent[] = [
                Headers.APPLICATION_JSON,
                { "Content-Length": JSON.stringify(payload).length.toString() },
                ZosmfHeaders.ACCEPT_ENCODING
            ];

            if (options.responseTimeout != null) {
                headers.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            await ZosmfRestClient.putExpectString(session, endpoint, headers, payload);

            return {
                success: true,
                commandResponse: returnMessage
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
