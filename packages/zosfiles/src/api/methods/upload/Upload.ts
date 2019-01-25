/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import * as path from "path";
import * as fs from "fs";

import { AbstractSession, ImperativeError, ImperativeExpect, IO, Logger } from "@brightside/imperative";
import { List } from "../list";

import { IHeaderContent, ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";

import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { IUploadOptions } from "./doc/IUploadOptions";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { IUploadResult } from "./doc/IUploadResult";
import * as util from "util";
import { getErrorContext } from "../../../../../utils";

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

        if (!fs.lstatSync(inputFile).isFile()) {
            throw new ImperativeError({
                msg: ZosFilesMessages.missingInputFile.message
            });
        }

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

        if (fs.lstatSync(inputDir).isFile()) {
            throw new ImperativeError({
                msg: util.format(
                ZosFilesMessages.pathIsNotDirectory.message,
                inputDir)
            });
        }

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
            if (options.recall){
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

        let uploadFileList: string[] = [];
        let isUploadToMember: boolean = false;
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

            isUploadToMember = true;
            memberName = dataSetName.substr(dataSetName.indexOf("(")).replace(/[()]/g, "");
            dataSetName = dataSetName.substr(0, dataSetName.indexOf("("));
        }

        // Retreive the information on the input data set name to determine if it is a
        // sequential data set or PDS.
        const listResponse = await List.dataSet(session, dataSetName, { attributes: true });
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
        // The reason we can not perform this task in parallel is because the Enqueing on a PDS.  It will
        // result will random errors when trying to upload to multiple member of the same PDS at the same time.
        // This also allow us to break out as soon as the first error is encounter instead of wait until the
        // entire list is processed.
        try {
            let uploadError;
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
            if (uploadError){
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
     * Get Log
     * @returns {Logger} applicationLogger.
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
        // return Logger.getConsoleLogger();
    }


}
