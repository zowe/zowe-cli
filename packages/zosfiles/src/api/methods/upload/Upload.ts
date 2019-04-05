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
import { IUploadFile } from "./doc/IUploadFile";
import { IUploadDir } from "./doc/IUploadDir";
import { asyncPool } from "../../../../../utils";
import { ZosFilesAttributes, TransferMode } from "../../utils/ZosFilesAttributes";
import { Utilities, Tag } from "../utilities";

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
        this.log.info(`Uploading directory ${inputDir} to ${dataSetName}`);

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
                                        binary: boolean = false,
                                        localEncoding?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSFileName.message);
        ussname = path.posix.normalize(ussname);
        ussname = ZosFilesUtils.formatUnixFilepath(ussname);
        ussname = encodeURIComponent(ussname);
        const parameters: string = ZosFilesConstants.RES_USS_FILES + "/" + ussname;
        const headers: any[] = [];
        if (binary) {
            headers.push(ZosmfHeaders.OCTET_STREAM);
            headers.push(ZosmfHeaders.X_IBM_BINARY);
        } else if (localEncoding) {
            headers.push({"Content-Type": localEncoding});
            headers.push(ZosmfHeaders.X_IBM_TEXT);
        } else {
            headers.push(ZosmfHeaders.TEXT_PLAIN);
        }

        return ZosmfRestClient.putExpectString(session, ZosFilesConstants.RESOURCE + parameters, headers, buffer);
    }

    public static async fileToUSSFile(session: AbstractSession,
                                      inputFile: string,
                                      ussname: string,
                                      binary: boolean = false,
                                      localEncoding?: string): Promise<IZosFilesResponse> {
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

        await this.bufferToUSSFile(session, ussname, payload, binary, localEncoding);
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
     * @param {IUploadOptions} [options={}]   - Uploading options
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dirToUSSDir(session: AbstractSession,
                                    inputDirectory: string,
                                    ussname: string,
                                    options: IUploadOptions = {}): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(inputDirectory, ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeEqual(inputDirectory,"", ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSDirectoryName.message);
        ImperativeExpect.toNotBeEqual(ussname, "", ZosFilesMessages.missingUSSDirectoryName.message);

        // Set default values for options
        options.binary = options.binary == null ? false : options.binary;
        options.recursive = options.recursive == null ? false : options.recursive;
        const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;
        try {
            // Check if inputDirectory is directory
            if(!IO.isDir(inputDirectory)) {
                throw new ImperativeError({
                    msg: ZosFilesMessages.missingInputDirectory.message
                });
            }

            // Check if provided unix directory exists
            const isDirectoryExist = await this.isDirectoryExist(session, ussname);
            if(!isDirectoryExist) {
                await Create.uss(session, ussname, "directory");
            }

            // initialize array for the files to be uploaded
            const filesArray: IUploadFile[] = [];

            // getting list of files from directory
            const files = ZosFilesUtils.getFileListFromPath(inputDirectory, false);
            // building list of files with full path and transfer mode
            files.forEach((file) => {
                let tempBinary = options.binary;
                // check if filesMap is specified, and verify if file is in the list
                if(options.filesMap) {
                    if(options.filesMap.fileNames.indexOf(file) > -1) {
                        // if file is in list, assign binary mode from mapping
                        tempBinary = options.filesMap.binary;
                    }
                }
                // update the array
                filesArray.push({
                    binary: tempBinary,
                    fileName: file}
                    );
            });

            let uploadsInitiated = 0;
            const createFileUploadPromise = (file: IUploadFile) => {
                // update the progress bar if any
                if (options.task != null) {
                    options.task.statusMessage = "Uploading ..." + this.formatStringForDisplay(file.fileName);
                    options.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (uploadsInitiated / filesArray.length));
                    uploadsInitiated++;
                }
                const fileName = path.normalize(path.join(inputDirectory, file.fileName));
                const ussFilePath = path.posix.join(ussname, file.fileName);
                return this.uploadFile(fileName,ussFilePath,session,options);
            };

            if (maxConcurrentRequests === 0) {
                await Promise.all(filesArray.map(createFileUploadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, filesArray, createFileUploadPromise);
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
        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }
    }


    /**
     * Upload directory to USS recursively
     * @param {AbstractSession} session       - z/OS connection info
     * @param {string} inputDirectory         - the path of local directory
     * @param {string} ussname                - the name of uss folder
     * @param {IUploadOptions} [options={}]   - Uploading options
     * @return {null}
     */
    public static async dirToUSSDirRecursive(session: AbstractSession,
                                             inputDirectory: string,
                                             ussname: string,
                                             options: IUploadOptions = {}): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(inputDirectory, ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeEqual(inputDirectory,"", ZosFilesMessages.missingInputDirectory.message);
        ImperativeExpect.toNotBeNullOrUndefined(ussname, ZosFilesMessages.missingUSSDirectoryName.message);
        ImperativeExpect.toNotBeEqual(ussname, "", ZosFilesMessages.missingUSSDirectoryName.message);

        // Set default values
        options.binary = options.binary == null ? false : options.binary;
        const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;

        // initialize arrays for the files and directories to be uploaded
        const filesArray: IUploadFile[] = [];
        let directoriesArray: IUploadDir[] = [];

        // Check if inputDirectory is directory
        if(!IO.isDir(inputDirectory)) {
            throw new ImperativeError({
                msg: ZosFilesMessages.missingInputDirectory.message
            });
        }

        // Check if provided unix directory exists
        const isDirectoryExist = await this.isDirectoryExist(session, ussname);
        if(!isDirectoryExist) {
            await Create.uss(session, ussname, "directory");
        }

        // getting list of files and sub-directories
        directoriesArray = Upload.getDirs(inputDirectory);

        if (options.attributes) {
            directoriesArray = directoriesArray.filter((dir: IUploadDir) => {
                return options.attributes.fileShouldBeUploaded(dir.fullPath);
            });
        }

        const files = ZosFilesUtils.getFileListFromPath(inputDirectory, false);

        files.forEach(async (file) => {
            let tempBinary = options.binary;
            // check if filesMap is specified, and verify if file is in the list
            if(options.filesMap) {
                if(options.filesMap.fileNames.indexOf(file) > -1) {
                    // if file is in list, assign binary mode from mapping
                    tempBinary = options.filesMap.binary;
                }
            }
            // update the array
            filesArray.push({
                binary: tempBinary,
                fileName: file}
                );
        });

        // create the directories
        if(directoriesArray.length > 0) {
            const createDirUploadPromise = async (dir: IUploadDir) => {
                const tempUssname = path.posix.join(ussname, dir.dirName);
                const isDirectoryExists = await this.isDirectoryExist(session, tempUssname);
                if(!isDirectoryExists) {
                    return Create.uss(session, tempUssname, "directory");
                }
            };

            if (maxConcurrentRequests === 0) {
                await Promise.all(directoriesArray.map(createDirUploadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, directoriesArray, createDirUploadPromise);
            }
        }

        for (const elem of directoriesArray) {
            await this.dirToUSSDirRecursive(session,
                elem.fullPath,
                path.posix.join(ussname,elem.dirName),
                options);
        }

        // upload the files
        if(filesArray.length > 0) {
            let uploadsInitiated = 0;
            const createUploadPromise = (file: IUploadFile) => {
                // update the progress bar if any
                if (options.task != null) {
                    options.task.statusMessage = "Uploading ..." + this.formatStringForDisplay(file.fileName);
                    options.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (uploadsInitiated / filesArray.length));
                    uploadsInitiated++;
                }
                const filePath = path.normalize(path.join(inputDirectory, file.fileName));
                const ussFilePath = path.posix.join(ussname, file.fileName);
                return this.uploadFile(filePath, ussFilePath, session, options);
            };
            if (maxConcurrentRequests === 0) {
                await Promise.all(filesArray.map(createUploadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, filesArray, createUploadPromise);
            }
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
        ussname = path.posix.normalize(ussname);
        ussname = encodeURIComponent(ussname);
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

    private static async uploadFile(localPath: string, ussPath: string,
                                    session: AbstractSession, options: IUploadOptions) {
        let tempBinary;

        if (options.attributes) {
            await this.uploadFileAndTagBasedOnAttributes(localPath, ussPath, session, options.attributes);
        }
        else {
            if (options.filesMap) {
                if (options.filesMap.fileNames.indexOf(path.basename(localPath)) > -1) {
                    tempBinary = options.filesMap.binary;
                }
                else {
                    tempBinary = options.binary;
                }
            }
            else {
                tempBinary = options.binary;
            }
            await this.fileToUSSFile(session, localPath, ussPath, tempBinary);
        }
    }

    private static async uploadFileAndTagBasedOnAttributes(localPath: string,
                                                           ussPath: string,
                                                           session: AbstractSession,
                                                           attributes: ZosFilesAttributes) {
        if (attributes.fileShouldBeUploaded(localPath)) {
            const binary = attributes.getFileTransferMode(localPath) === TransferMode.BINARY;
            if (binary) {
                await this.fileToUSSFile(session, localPath, ussPath, binary);
            } else {
                await this.fileToUSSFile(session, localPath, ussPath, binary, attributes.getLocalEncoding(localPath));
            }

            const tag = attributes.getRemoteEncoding(localPath);
            if (tag === Tag.BINARY.valueOf() ) {
                await Utilities.chtag(session,ussPath,Tag.BINARY);
            } else {
                await Utilities.chtag(session,ussPath,Tag.TEXT,tag);
            }
        }
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
     * Checks if a given directory has sub-directories or not
     * @param {string} dirPath full-path for the directory to check
     */
    private static hasDirs(dirPath: string): boolean {
        const directories = fs.readdirSync(dirPath).filter((file) => IO.isDir(path.normalize(path.join(dirPath, file))));
        // directories = directories.filter((file) => IO.isDir(path.normalize(path.join(dirPath, file))));
        if (directories.length === 0) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Returns an array of sub-directories objects, containing directory name, and full path specification
     * @param dirPath full-path for the directory to check
     */
    private static getDirs(dirPath: string): IUploadDir[] {
        const response: IUploadDir[] = [];
        if (Upload.hasDirs(dirPath)) {
            const directories = fs.readdirSync(dirPath).filter((file) => IO.isDir(path.normalize(path.join(dirPath, file))));
            // directories = directories.filter((file) => IO.isDir(path.normalize(path.join(dirPath, file))));
            // tslint:disable-next-line:prefer-for-of
            for (let index = 0; index < directories.length; index++) {
                const dirFullPath = path.normalize(path.join(dirPath,directories[index]));
                response.push({
                    dirName: directories[index],
                    fullPath: dirFullPath});
            }
        }
        return response;
    }

    /**
     * helper function to prepare file names for display on progress bar
     * @param stringInput string input to be formated
     */
    private static formatStringForDisplay(stringInput: string): string {
        const LAST_FIFTEEN_CHARS = -15;
        const  stringToDisplay: string = stringInput.split(path.sep).splice(-1,1).toString().slice(LAST_FIFTEEN_CHARS);
        const result: string = stringToDisplay === "" ? "all files" : stringToDisplay;

        return result;
    }
}
