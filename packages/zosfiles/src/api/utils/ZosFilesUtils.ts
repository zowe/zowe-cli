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
import { IO } from "@brightside/imperative";

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
                if (fs.lstatSync(tempPath).isFile()){
                    if (!(isIgnoreHidden && path.basename(file).startsWith("."))){
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
        return Buffer.from(buffer.toString().replace(new RegExp("\r\n", "g"), "\n"));
    }
}

