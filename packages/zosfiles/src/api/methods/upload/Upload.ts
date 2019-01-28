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

import { AbstractSession, ImperativeError, ImperativeExpect, IO, Logger, TaskProgress } from "@brightside/imperative";
import * as fs from "fs";
import * as path from "path";

import { IHeaderContent, ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";

import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { List } from "../list";
import { IUploadOptions } from "./doc/IUploadOptions";
import { IUploadResult } from "./doc/IUploadResult";
import { Create } from "../create";
import { IUploadMap } from "./doc/IUploadMap";

export class Upload {

    /**
     * Upload content from file to data set
     * @param {AbstractSession} session      - z/OS connection info
     * @param {string}          inputFile    - path to a file
     * @param {string}          dataSetName  - Name of the data set to write to
     * @param {IUploadOptions}  [options={}] - Uploading options
     *
     * @return {Promise<IZosFilesResponse>} A response indicating the out come
     *
     * @throws {ImperativeError} When encounter error scenarios.
     *
     */
    public static async fileToDataset(session: AbstractSession,
                                      inputFile: string,
                                      dataSetName: string,
                                      options: IUploadOptions = {}): Promise<IZosFilesResponse> {
        this.log.info(`Uploading file ${inputFile} to ${dataSetName}`);

        ImperativeExpect.toNotBeNullOrUndefined(inputFile, ZosFilesMessages.missingInputFile.message);
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        const promise = new Promise((resolve, reject) => {
            fs.lstat(inputFile, (err, stats) => {
                if (err == null && stats.isFile()) {
                    resolve(true);
                } else if (err == null) {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.missingInputFile.message
                        })
                    );
                } else {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.nodeJsFsError.message,
                            additionalDetails: err.toString(),
                            causeErrors: err
                        })
                    );
                }
            });
        });

        await promise;

        return this.pathToDataSet(session, inputFile, dataSetName, options);
    }

    /**
     * Upload content from a directory to a PDS
     * @param {AbstractSession} session      - z/OS connection info
     * @param {string}          inputDir     - path to a file
     * @param {string}          dataSetName  - Name of the data set to write to
     * @param {IUploadOptions}  [options={}] - Uploading options
     *
     * @return {Promise<IZosFilesResponse>} A response indicating the out come
     *
     * @throws {ImperativeError} When encounter error scenarios.
     *
     */
    public static async dirToPds(session: AbstractSession,
                                 inputDir: string,
                                 dataSetName: string,
                                 options: IUploadOptions = {}): Promise<IZosFilesResponse> {
        this.log.info(`Uploading file ${inputDir} to ${dataSetName}`);

        ImperativeExpect.toNotBeNullOrUndefined(inputDir, ZosFilesMessages.missingInputDir.message);
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        const promise = new Promise((resolve, reject) => {
            fs.lstat(inputDir, (err, stats) => {
                if (err == null && !stats.isFile()) {
                    resolve(true);
                } else if (err == null) {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.pathIsNotDirectory.message
                        })
                    );
                } else {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.nodeJsFsError.message,
                            additionalDetails: err.toString(),
                            causeErrors: err
                        })
                    );
                }
            });
        });

        await promise;

        if (!IO.isDir(inputDir)) {
            throw new ImperativeError({
                msg: ZosFilesMessages.missingInputDir.message
            });
        }

        return this.pathToDataSet(session, inputDir, dataSetName, options);
    }

    /**
     * Writting data buffer to a data set.
     * @param {AbstractSession} session      - z/OS connection info
     * @param {Buffer}          fileBuffer   - Data buffer to be written
     * @param {string}          dataSetName  - Name of the data set to write to
     * @param {IUploadOptions}  [options={}] - Uploading options
     *
     * @return {Promise<IZosFilesResponse>} A response indicating the out come
     *
     * @throws {ImperativeError} When encounter error scenarios.
     */
    public static async bufferToDataSet(session: AbstractSession,
                                        fileBuffer: Buffer,
                                        dataSetName: string,
                                        options: IUploadOptions = {}): Promise<IZosFilesResponse> {

        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);

        try {
            // Construct zOSMF REST endpoint.
            let endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES);
            if (options.volume) {
                endpoint = path.posix.join(endpoint, `-(${options.volume})`);
            }
            endpoint = path.posix.join(endpoint, dataSetName);

            // Construct request header parameters
            const reqHeader: IHeaderContent[] = [];
            if (options.binary) {
                reqHeader.push(ZosmfHeaders.X_IBM_BINARY);
            } else {
                reqHeader.push(ZosmfHeaders.X_IBM_TEXT);
                fileBuffer = ZosFilesUtils.normalizeNewline(fileBuffer);
            }

            // Migrated recall options
            if (options.recall) {
                switch (options.recall.toLowerCase()) {
                    case "wait":
                        reqHeader.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT);
                        break;
                    case "nowait":
                        reqHeader.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT);
                        break;
                    case "error":
                        reqHeader.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR);
                        break;
                    default:
                        reqHeader.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT);
                        break;
                }
            }

            await ZosmfRestClient.putExpectString(session, endpoint, reqHeader, fileBuffer);

            return {
                success: true,
                commandResponse: ZosFilesMessages.dataSetUploadedSuccessfully.message
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Upload content from input path to dataSet or PDS members
     * @param {AbstractSession} session      - z/OS connection info
     * @param {string}          inputPath    - User input path to file or directory
     * @param {string}          dataSetName  - Name of the data set to write to
     * @param {IUploadOptions}  [options={}] - Uploading options
     *
     * @return {Promise<IZosFilesResponse>} A response indicating the out come
     *
     * @throws {ImperativeError} When encounter error scenarios.
     *
     * @example pathToDataSet(session, "file.txt", "ps.name")
     * @example pathToDataset(session, "file.txt", "psd.name(member)")
     * @example pathToDataSet(session, "directory", "pds.name")
     * @example pathToDataset(session, "/full/path/file.txt", "ps.name")
     *
     * Note:
     * This method does everything needed to do from checking if path is file or directory
     * and if data set is sequential file or PDS to determind what name to be used when
     * upload content to data set.  All you have to specify is a directory and a dsname.
     */
    public static async pathToDataSet(session: AbstractSession,
                                      inputPath: string,
                                      dataSetName: string,
                                      options: IUploadOptions = {}): Promise<IZosFilesResponse> {

        this.log.info(`Uploading path ${inputPath} to ${dataSetName}`);

        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        let payload;
        let memberName: string = "";
        let uploadingFile: string = "";
        let uploadingDsn: string = "";

        let uploadFileList: string[];
        let isUploadToPds: boolean = false;
        const results: IUploadResult[] = [];


        // Check and make sure that data set name does not contain any masking character (%*).
        if (ZosFilesUtils.isDataSetNameContainMasking(dataSetName)) {
            throw new ImperativeError({
                msg: ZosFilesMessages.unsupportedMaskingInDataSetName.message
            });
        }

        // From the input path, retrieve the list of all files that we are trying to upload.
        // If input is a file, the return is an array of 1 element,
        // If input is a directory, the return will be an array of all of it files.
        uploadFileList = ZosFilesUtils.getFileListFromPath(inputPath);

        // Check if data set name is actually a PDS member.
        //   if it is, then we have to make sure that we do not try to upload a directory
        //   to a PDS member.
        if (dataSetName.endsWith(")")) {
            if (IO.isDir(inputPath)) {
                throw new ImperativeError({
                    msg: ZosFilesMessages.uploadDirectoryToDatasetMember.message
                });
            }

            memberName = dataSetName.substr(dataSetName.indexOf("(")).replace(/[()]/g, "");
            dataSetName = dataSetName.substr(0, dataSetName.indexOf("("));
        }


        // Retrieve the information on the input data set name to determine if it is a
        // sequential data set or PDS.
        const listResponse = await List.dataSet(session, dataSetName, {attributes: true});
        if (listResponse.apiResponse != null && listResponse.apiResponse.returnedRows != null && listResponse.apiResponse.items != null) {
            // Look for the index of the data set in the response from the List API
            const dsnameIndex = listResponse.apiResponse.returnedRows === 0 ? -1 :
                listResponse.apiResponse.items.findIndex((ds: any) => ds.dsname.toUpperCase() === dataSetName.toUpperCase());
            if (dsnameIndex !== -1) {
                // If dsnameIndex === -1, it means we could not find the given data set.
                // We will attempt the upload anyways so that we can forward/throw the proper error from z/OS MF
                const dsInfo = listResponse.apiResponse.items[dsnameIndex];
                switch (dsInfo.dsorg) {
                    case "PO":
                    case "PO-E":
                        isUploadToPds = true;
                        break;
                    default:
                        // if loading to a physical sequential data set and multiple files found then error
                        if (uploadFileList.length > 1) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.uploadDirectoryToPhysicalSequentialDataSet.message
                            });
                        }
                        break;
                }
            }
        }

        // Loop through the array of upload file and perform upload one file at a time.
        // The reason we can not perform this task in parallel is because the Enqueueing on a PDS.  It will
        // result will random errors when trying to upload to multiple member of the same PDS at the same time.
        // This also allow us to break out as soon as the first error is encounter instead of wait until the
        // entire list is processed.
        try {
            let uploadError;
            let uploadsInitiated = 0;
            for (const file of uploadFileList) {
                uploadingFile = file;
                uploadingDsn = dataSetName;

                if (isUploadToPds) {

                    if (memberName.length === 0) {
                        uploadingDsn = `${uploadingDsn}(${ZosFilesUtils.generateMemberName(uploadingFile)})`;
                    } else {
                        uploadingDsn = `${uploadingDsn}(${memberName})`;
                    }
                }
                uploadingDsn = uploadingDsn.toUpperCase();

                if (options.task != null) {
                    // update the progress bar if any
                    const LAST_FIFTEEN_CHARS = -15;
                    const abbreviatedFile = uploadingFile.slice(LAST_FIFTEEN_CHARS);
                    options.task.statusMessage = "Uploading ..." + abbreviatedFile;
                    options.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (uploadsInitiated / uploadFileList.length));
                    uploadsInitiated++;
                }

                if (uploadError === undefined) {
                    try {
                        // read payload from file
                        payload = fs.readFileSync(uploadingFile);

                        const result = await this.bufferToDataSet(session, payload, uploadingDsn, options);
                        this.log.info(`Success Uploaded data From ${uploadingFile} To ${uploadingDsn}`);
                        results.push({
                            success: result.success,
                            from: uploadingFile,
                            to: uploadingDsn
                        });
                    } catch (err) {
                        this.log.error(`Failure Uploading data From ${uploadingFile} To ${uploadingDsn}`);
                        results.push({
                            success: false,
                            from: uploadingFile,
                            to: uploadingDsn,
                            error: err
                        });
                        uploadError = err;
                    }
                } else {
                    results.push({
                        success: undefined,
                        from: uploadingFile,
                        to: uploadingDsn,
                    });
                }
            }
            if (uploadError) {
                throw uploadError;
            }

            return {
                success: true,
                commandResponse: ZosFilesMessages.dataSetUploadedSuccessfully.message,
                apiResponse: results
            };

        } catch (error) {
            return {
                success: false,
                commandResponse: error.message,
                apiResponse: results
            };
        }
    }

    /**
     * Upload content to USS file
     * @param {AbstractSession} session - z/OS connection info
     * @param {string} ussname          - Name of the USS file to write to
     * @param {Buffer} buffer          - Data to be written
     * @param {boolean} binary          - The indicator to upload the file in binary mode
     * @returns {Promise<object>}
     */
    public static async bufferToUSSFile(session: AbstractSession,
                                        ussname: string,
                                        buffer: Buffer,
                                        binary: boolean = false) {
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSFileName.message);
        ussname = path.posix.normalize(ussname);
        ussname = Upload.formatUnixFilepath(ussname);
        const parameters: string = ZosFilesConstants.RES_USS_FILES + "/" + ussname;
        const headers: any[] = [];
        if (binary) {
            headers.push(ZosmfHeaders.OCTET_STREAM);
            headers.push(ZosmfHeaders.X_IBM_BINARY);
        } else {
            headers.push(ZosmfHeaders.TEXT_PLAIN);
        }

        return ZosmfRestClient.putExpectString(session, ZosFilesConstants.RESOURCE + parameters, headers, buffer);
    }

    public static async fileToUSSFile(session: AbstractSession,
                                      inputFile: string,
                                      ussname: string,
                                      binary: boolean = false): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(inputFile, ZosFilesMessages.missingInputFile.message);
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(ussname, "", ZosFilesMessages.missingUSSFileName.message);

        const promise = new Promise((resolve, reject) => {
            fs.lstat(inputFile, (err, stats) => {
                if (err == null && stats.isFile()) {
                    resolve(true);
                } else if (err == null) {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.missingInputFile.message
                        })
                    );
                } else {
                    reject(
                        new ImperativeError({
                            msg: ZosFilesMessages.nodeJsFsError.message,
                            additionalDetails: err.toString(),
                            causeErrors: err
                        })
                    );
                }
            });
        });

        await promise;

        let payload;
        let result: IUploadResult;

        // read payload from file
        payload = fs.readFileSync(inputFile);

        await this.bufferToUSSFile(session, ussname, payload, binary);
        result = {
            success: true,
            from: inputFile,
            to: ussname
        };
        return {
            success: true,
            commandResponse: ZosFilesMessages.ussFileUploadedSuccessfully.message,
            apiResponse: result
        };
    }

    /**
     * Upload local directory to USS directory
     * @param {AbstractSession} session - z/OS connection info
     * @param {string} inputDirectory   - the path of local directory
     * @param {string} ussname          - the name of uss folder
     * @param {boolean} binary          - the indicator to upload the file in binary mode
     * @param {boolean} recursive       - the indicator to upload local folder recursively
     * @param {IUploadMap} filesMap     - the map to define which files to upload in binary or asci mode
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dirToUSSDir(session: AbstractSession,
                                    inputDirectory: string,
                                    ussname: string,
                                    binary: boolean = false,
                                    recursive: boolean = false,
                                    filesMap?: IUploadMap): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(inputDirectory, ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeEqual(inputDirectory,"", ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSDirectoryName.message);
        ImperativeExpect.toNotBeEqual(ussname, "", ZosFilesMessages.missingUSSDirectoryName.message);

        // Check if inputDirectory is directory
        if(!fs.lstatSync(inputDirectory).isDirectory()) {
            throw new ImperativeError({
                msg: ZosFilesMessages.missingInputDirectory.message
            });
        }

        // Check if provided unix directory exists
        const isDirectoryExist = await this.isDirectoryExist(session, ussname);
        if(!isDirectoryExist) {
            await Create.uss(session, ussname, "directory");
        }

        if(recursive === false) {
            const files = ZosFilesUtils.getFileListFromPath(inputDirectory, false);
            await Promise.all(files.map(async (fileName) => {
                const filePath = path.normalize(path.join(inputDirectory, fileName));
                if(!IO.isDir(filePath)) {
                    let tempBinary;
                    if(filesMap) {
                        if(filesMap.fileNames.indexOf(fileName) > -1) {
                            tempBinary = filesMap.binary;
                        } else {
                            tempBinary = binary;
                        }
                    } else {
                        tempBinary = binary;
                    }
                    const ussFilePath = path.posix.join(ussname, fileName);
                    await this.fileToUSSFile(session, filePath, ussFilePath, tempBinary);
                }
            }));
        } else {
            await this.dirToUSSDirRecursive(session, inputDirectory, ussname, binary, filesMap);
        }

        const result: IUploadResult = {
            success: true,
            from: inputDirectory,
            to: ussname
        };
        return {
            success: true,
            commandResponse: ZosFilesMessages.ussDirUploadedSuccessfully.message,
            apiResponse: result
        };
    }

    /**
     * Check if USS directory exists
     * @param {AbstractSession} session - z/OS connection info
     * @param {string} ussname          - the name of uss folder
     * @return {Promise<boolean>}
     */
    public static async isDirectoryExist(session: AbstractSession, ussname: string): Promise<boolean> {
        const parameters: string = `${ZosFilesConstants.RES_USS_FILES}?path=${ussname}`;
        try {
            const response: any = await ZosmfRestClient.getExpectJSON(session, ZosFilesConstants.RESOURCE + parameters);
            if(response.items) {
                return true;
            }
        } catch (err) {
            if (err) {
                return false;
            }
        }
        return false;
    }

    /**
     * Upload directory to USS recursively
     * @param {AbstractSession} session - z/OS connection info
     * @param {string} inputDirectory   - the path of local directory
     * @param {string} ussname          - the name of uss folder
     * @param {boolean} binary          - the indicator to upload the file in binary mode
     * @param {IUploadMap} filesMap     - the map to define which files to upload in binary or asci mode
     * @return {null}
     */
    private static async dirToUSSDirRecursive(session: AbstractSession,
                                              inputDirectory: string,
                                              ussname: string,
                                              binary: boolean,
                                              filesMap?: IUploadMap) {
        await Promise.all(fs.readdirSync(inputDirectory).map(async (fileName) => {
            const filePath = path.normalize(path.join(inputDirectory, fileName));
            if(!IO.isDir(filePath)) {
                let tempBinary;
                if(filesMap) {
                    if(filesMap.fileNames.indexOf(fileName) > -1) {
                        tempBinary = filesMap.binary;
                    } else {
                        tempBinary = binary;
                    }
                } else {
                    tempBinary = binary;
                }
                const ussFilePath = path.posix.join(ussname, fileName);
                await this.fileToUSSFile(session, filePath, ussFilePath, tempBinary);
            } else {
                const tempUssPath = path.posix.join(ussname, fileName);
                // Check if provided unix directory exists
                const isDirectoryExist = await this.isDirectoryExist(session, tempUssPath);
                if(!isDirectoryExist) {
                    await Create.uss(session, tempUssPath, "directory");
                }
                await this.dirToUSSDirRecursive(session, filePath, tempUssPath, binary, filesMap);
            }
        }));
        return;
    }

    /**
     * Get Log
     * @returns {Logger} applicationLogger.
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
        // return Logger.getConsoleLogger();
    }

    /**
     * Format USS filepaths in the way that the APIs expect (no leading /)
     * @param {string} usspath - the path to format
     */
    private static formatUnixFilepath(usspath: string) {
        if (usspath.charAt(0) === "/") {
            // trim leading slash from unix files - API doesn't like it
            usspath = usspath.substring(1);
        }
        return usspath;
    }

}
