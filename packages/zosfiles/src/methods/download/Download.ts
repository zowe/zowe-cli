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

import { AbstractSession, ImperativeExpect, IO, Logger, TaskProgress, ImperativeError, TextUtils } from "@zowe/imperative";

import { posix } from "path";
import * as util from "util";

import { ZosmfRestClient, IHeaderContent, ZosmfHeaders, asyncPool } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { List } from "../list/List";
import { IDownloadOptions } from "./doc/IDownloadOptions";
import { IRestClientResponse } from "../../doc/IRestClientResponse";
import { CLIENT_PROPERTY } from "../../doc/types/ZosmfRestClientProperties";
import { IOptionsFullResponse } from "../../doc/IOptionsFullResponse";
import { Utilities } from "../utilities";
import { IZosmfListResponse } from "../list/doc/IZosmfListResponse";

type IZosmfListResponseWithStatus = IZosmfListResponse & { status?: string };

/**
 * This class holds helper functions that are used to download data sets, members and more through the z/OS MF APIs
 */
export class Download {
    /**
     * Retrieve data sets and/or members contents and save them in your local workspace
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           dataSetName  - contains the data set name
     * @param {IDownloadOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @example
     * ```typescript
     *
     * // Download "USER.DATA.SET.PS" to "user/data/set/ps.txt"
     * await Download.dataSet(session, "USER.DATA.SET.PS");
     *
     * // Download "USER.DATA.SET.PDS(MEMBER)" to "user/data/set/pds/member.txt"
     * await Download.dataSet(session, "USER.DATA.SET.PDS(MEMBER)");
     *
     * // Download "USER.DATA.SET" to "./path/to/file.txt"
     * await Download.dataSet(session, "USER.DATA.SET", {file: "./path/to/file.txt"});
     * ```
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_GetReadDataSet.htm
     */
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IDownloadOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            // Format the endpoint to send the request to
            let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES);

            if (options.volume) {
                endpoint = posix.join(endpoint, `-(${options.volume})`);
            }

            endpoint = posix.join(endpoint, dataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const reqHeaders: IHeaderContent[] = ZosFilesUtils.generateHeadersBasedOnOptions(options);

            // Get contents of the data set
            let extension = ZosFilesUtils.DEFAULT_FILE_EXTENSION;
            if (options.extension != null) {
                extension = options.extension;
            }

            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the data set name
            // Note that the "extension" options do not affect the destination if the "file" options were provided
            const destination = (() => {
                if (options.file) {
                    return options.file;
                }

                let generatedFilePath = ZosFilesUtils.getDirsFromDataSet(dataSetName);
                // Method above lowercased characters.
                // In case of preserving original letter case, uppercase all characters.
                if (options.preserveOriginalLetterCase) {
                    generatedFilePath = generatedFilePath.toUpperCase();
                }

                return generatedFilePath + IO.normalizeExtension(extension);
            })();

            IO.createDirsSyncFromFilePath(destination);

            const writeStream = IO.createWriteStream(destination);

            // Use specific options to mimic ZosmfRestClient.getStreamed()
            const requestOptions: IOptionsFullResponse = {
                resource: endpoint,
                reqHeaders,
                responseStream: writeStream,
                normalizeResponseNewLines: !(options.binary || options.record),
                task: options.task
            };

            // If requestor needs etag, add header + get "response" back
            if (options.returnEtag) {
                requestOptions.reqHeaders.push(ZosmfHeaders.X_IBM_RETURN_ETAG);
                requestOptions.dataToReturn = [CLIENT_PROPERTY.response];
            }

            const request: IRestClientResponse = await ZosmfRestClient.getExpectFullResponse(session, requestOptions);

            // By default, apiResponse is empty when downloading
            const apiResponse: any = {};

            // Return Etag in apiResponse, if requested
            if (options.returnEtag) {
                apiResponse.etag = request.response.headers.etag;
            }

            return {
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, destination),
                apiResponse
            };
        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }
    }

    /**
     * Retrieve all members from a PDS and save them in your local workspace
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           dataSetName  - contains the data set name
     * @param {IDownloadOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @example
     * ```typescript
     *
     * // Download all members of "USER.DATA.SET.PDS" to "user/data/set/pds/"
     * await Download.allMembers(session, "USER.DATA.SET.PDS");
     *
     * // Download all members of "USER.DATA.SET.PDS" to "./path/to/dir/"
     * await Download.allMembers(session, "USER.DATA.SET.PDS", {directory: "./path/to/dir/"});
     * ```
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_GetReadDataSet.htm
     */
    public static async allMembers(session: AbstractSession, dataSetName: string, options: IDownloadOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            const response = await List.allMembers(session, dataSetName, {
                volume: options.volume,
                responseTimeout: options.responseTimeout
            });

            const memberList: Array<{ member: string }> = response.apiResponse.items;
            if (memberList.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.noMembersFound.message,
                    apiResponse: response.apiResponse
                };
            }

            // If the "directory" option is provided, use it.
            // Otherwise use default directory generated from data set name.
            const baseDir = (() => {
                if (options.directory) {
                    return options.directory;
                }

                let generatedDirectory = ZosFilesUtils.getDirsFromDataSet(dataSetName);
                // Method above lowercased characters.
                // In case of preserving original letter case, uppercase all characters.
                if (options.preserveOriginalLetterCase) {
                    generatedDirectory = generatedDirectory.toUpperCase();
                }

                return generatedDirectory;
            })();

            const downloadErrors: Error[] = [];
            const failedMembers: string[] = [];
            let downloadsInitiated = 0;

            let extension = ZosFilesUtils.DEFAULT_FILE_EXTENSION;
            if (options.extension != null) {
                extension = options.extension;
            }

            /**
             * Function that takes a member and turns it into a promise to download said member
             * @param mem - an object with a "member" field containing the name of the data set member
             */
            const createDownloadPromise = (mem: { member: string }) => {
                // update the progress bar if any
                if (options.task != null) {
                    options.task.statusMessage = "Downloading " + mem.member;
                    options.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (downloadsInitiated / memberList.length));
                    downloadsInitiated++;
                }

                const fileName = options.preserveOriginalLetterCase ? mem.member : mem.member.toLowerCase();
                return this.dataSet(session, `${dataSetName}(${mem.member})`, {
                    volume: options.volume,
                    file: baseDir + IO.FILE_DELIM + fileName + IO.normalizeExtension(extension),
                    binary: options.binary,
                    record: options.record,
                    encoding: options.encoding,
                    responseTimeout: options.responseTimeout
                }).catch((err) => {
                    // If we should fail fast, rethrow error
                    if (options.failFast || options.failFast === undefined) {
                        throw err;
                    }
                    downloadErrors.push(err);
                    failedMembers.push(fileName);
                    // Delete the file that could not be downloaded
                    IO.deleteFile(baseDir + IO.FILE_DELIM + fileName + IO.normalizeExtension(extension));
                });
            };

            const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;

            if (maxConcurrentRequests === 0) {
                await Promise.all(memberList.map(createDownloadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, memberList, createDownloadPromise);
            }

            // Handle failed downloads if no errors were thrown yet
            if (downloadErrors.length > 0) {
                throw new ImperativeError({
                    msg: ZosFilesMessages.memberDownloadFailed.message + failedMembers.join("\n") + "\n\n" +
                        downloadErrors.map((err: Error) => err.message).join("\n"),
                    causeErrors: downloadErrors,
                    additionalDetails: failedMembers.join("\n")
                });
            }

            return {
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetDownloadedSuccessfully.message, baseDir),
                apiResponse: response.apiResponse
            };

        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }
    }

    /**
     * Download data sets that match a DSLEVEL pattern to local files
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           patterns     - contains the data set(s) pattern
     * @param {IDownloadOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @example
     * ```typescript
     *
     * // Download all "PS" and "PO" datasets that match the pattern "USER.**.DATASET" to "user/data/set/pds/"
     * await Download.dataSetsMatchingPatterns(session, "USER.DATA.SET.PDS");
     *
     * // Download all "PS" and "PO" datasets that match the pattern "USER.**.DATASET" to "./path/to/dir/"
     * await Download.dataSetsMatchingPatterns(session, "USER.**.PDS", {directory: "./path/to/dir/"});
     * ```
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.2.0/com.ibm.zos.v2r2.izua700/IZUHPINFO_API_GetReadDataSet.htm
     */
    public static async dataSetsMatchingPattern(session: AbstractSession, patterns: string[],
        options: IDownloadOptions = {}): Promise<IZosFilesResponse> {
        // Pattern is required to be non-empty
        ImperativeExpect.toNotBeNullOrUndefined(patterns, ZosFilesMessages.missingPatterns.message);
        patterns = patterns.filter(Boolean);
        ImperativeExpect.toNotBeEqual(patterns.length, 0, ZosFilesMessages.missingPatterns.message);

        // Arrays of all downloaded or skipped data set objects
        const arrayOfArchivedDs: IZosmfListResponseWithStatus[] = [];
        const arrayOfSkippedDs: IZosmfListResponseWithStatus[] = [];
        const arrayOfExcludedDs: IZosmfListResponseWithStatus[] = [];
        const arrayOfEmptyPOdataSets: IZosmfListResponseWithStatus[] = [];
        let arrayOfDatasets: IZosmfListResponseWithStatus[] = [];

        const width = 40;

        try {
            // Get names of all data sets
            for (const pattern of patterns) {
                const listOfDataSets = await List.dataSet(session, pattern, { attributes: true });
                arrayOfDatasets.push(...listOfDataSets.apiResponse.items);
            }

            // Check if data sets matching pattern found
            if (arrayOfDatasets.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.noDataSetsMatchingPattern.message,
                    apiResponse: []
                };
            }

            // Exclude archived data sets
            for (const dataSetObj of arrayOfDatasets) {
                if (dataSetObj.dsorg == null) {
                    dataSetObj.status = TextUtils.wordWrap(`Skipped: Archived data set or alias - type ${dataSetObj.vol}.`, width);
                    arrayOfArchivedDs.push(dataSetObj);
                }
            }

            arrayOfDatasets = arrayOfDatasets.filter((dataSetObj: IZosmfListResponse) => dataSetObj.dsorg != null);

            // Check if non-archived data sets matching pattern remain
            if (arrayOfDatasets.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.allDataSetsArchived.message,
                    apiResponse: []
                };
            }

            // Exclude data sets matching exclude pattern
            if (options.excludePatterns != null) {
                const arrExcl: string[] = [];
                for (const pattern of options.excludePatterns) {
                    const listOfDataSets = await List.dataSet(session, pattern, { attributes: true });
                    listOfDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => {
                        arrExcl.push(dataSetObj.dsname);
                        arrayOfExcludedDs.push(dataSetObj);
                    });
                }

                arrayOfDatasets = arrayOfDatasets.filter((dataSetObj: IZosmfListResponse) => arrExcl.indexOf(dataSetObj.dsname) === -1);
            }

            for (const dataSetObj of arrayOfExcludedDs) {
                dataSetObj.status = TextUtils.wordWrap(`Skipped: Data set matches one or more patterns provided in` +
                    ` --exclude-patterns option`, width);
            }

            // Check if exclude pattern has left any data sets in the list
            if (arrayOfDatasets.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.noDataSetsInList.message,
                    apiResponse: []
                };
            }

            // Download data sets
            const arrEmptyPO: string[] = [];
            const arrSkipped: string[] = [];
            const downloadPromises: Promise<IZosFilesResponse>[] = [];
            const mutableOptions = {...options};
            for (const dataSetObj of arrayOfDatasets) {
                const llq = dataSetObj.dsname.substring(dataSetObj.dsname.lastIndexOf(".") + 1, dataSetObj.dsname.length).toLowerCase();
                if (options.extensionMap != null) {
                    mutableOptions.extension = options.extensionMap[llq] ?? options.extension;
                }

                // Normalize the extension, remove leading periods
                if (mutableOptions.extension && mutableOptions.extension.startsWith(".")) {
                    mutableOptions.extension = mutableOptions.extension.replace(/^\.+/g, "");
                }

                if (options.directory == null) {
                    if (dataSetObj.dsorg === "PO" || dataSetObj.dsorg === "PO-E") {
                        mutableOptions.directory = ZosFilesUtils.getDirsFromDataSet(dataSetObj.dsname);
                    } else {
                        mutableOptions.file = (`${dataSetObj.dsname}.` + 
                            `${mutableOptions.extension ?? ZosFilesUtils.DEFAULT_FILE_EXTENSION}`).toLowerCase();
                        mutableOptions.directory = undefined;
                        mutableOptions.extension = undefined;
                    }
                } else if (dataSetObj.dsorg === "PO" || dataSetObj.dsorg === "PO-E") {
                    mutableOptions.directory = `${mutableOptions.directory}/${ZosFilesUtils.getDirsFromDataSet(dataSetObj.dsname)}`;
                } else {
                    mutableOptions.file = (`${mutableOptions.directory}/${dataSetObj.dsname}.` + 
                        `${mutableOptions.extension ?? ZosFilesUtils.DEFAULT_FILE_EXTENSION}`).toLowerCase();
                    mutableOptions.directory = undefined;
                    mutableOptions.extension = undefined;
                }

                if (dataSetObj.dsorg === "PS") {
                    downloadPromises.push(Download.dataSet(session, dataSetObj.dsname, { ...mutableOptions }).then((downloadResponse) => {
                        dataSetObj.status = TextUtils.wordWrap(`${downloadResponse.commandResponse}`, width);
                        return downloadResponse;
                    }));
                } else if (dataSetObj.dsorg === "PO" || dataSetObj.dsorg === "PO-E") {
                    downloadPromises.push(Download.allMembers(session, dataSetObj.dsname, { ...mutableOptions }).then((downloadResponse) => {
                        const listMembers: string[] = downloadResponse.apiResponse.items.map((item: any) => ` ${item.member}`);
                        dataSetObj.status = TextUtils.wordWrap(`${downloadResponse.commandResponse}\nMembers: ${listMembers};`, width);
                        if (downloadResponse.apiResponse.returnedRows === 0) {
                            arrEmptyPO.push(dataSetObj.dsname);
                            dataSetObj.status = TextUtils.wordWrap(`Skipped: Partitioned data set with zero members.`, width);
                            arrayOfEmptyPOdataSets.push(dataSetObj);
                        }
                        return downloadResponse;
                    }));
                } else {
                    arrSkipped.push(dataSetObj.dsname);
                    dataSetObj.status = TextUtils.wordWrap(`Skipped: Unsupported data set - type ${dataSetObj.dsorg}.`, width);
                    arrayOfSkippedDs.push(dataSetObj);
                }
                mutableOptions.directory = options.directory;
            }

            const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;
            if (maxConcurrentRequests === 0) {
                await Promise.all(downloadPromises);
            } else {
                await asyncPool(maxConcurrentRequests, downloadPromises, (p: Promise<IZosFilesResponse>) => p);
            }

            arrayOfDatasets = arrayOfDatasets.filter((dataSetObj: IZosmfListResponse) => arrEmptyPO.indexOf(dataSetObj.dsname) === -1);
            if (arrayOfDatasets.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.onlyEmptyPartitionedDataSets.message,
                    apiResponse: []
                };
            }

            arrayOfDatasets = arrayOfDatasets.filter((dataSetObj: IZosmfListResponse) => arrSkipped.indexOf(dataSetObj.dsname) === -1);
            if (arrayOfDatasets.length === 0) {
                return {
                    success: false,
                    commandResponse: ZosFilesMessages.noDataSetsMatchingPatternRemain.message,
                    apiResponse: []
                };
            }

            // All processed data sets, downloaded successfully or skipped
            const arrayOfEveryDS: IZosmfListResponse[] = [...arrayOfArchivedDs, ...arrayOfSkippedDs,
                ...arrayOfExcludedDs, ...arrayOfEmptyPOdataSets, ...arrayOfDatasets];
            const destination = options.directory ?? "./";

            return {
                success: true,
                commandResponse: util.format(ZosFilesMessages.datasetsDownloadedSuccessfully.message, destination),
                apiResponse: arrayOfEveryDS
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Retrieve USS file content and save it in your local workspace.
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           ussFileName  - contains the USS file name
     * @param {IDownloadOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} USS file name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */
    public static async ussFile(session: AbstractSession, ussFileName: string, options: IDownloadOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(ussFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(ussFileName, "", ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(options.record, true, ZosFilesMessages.unsupportedDataType.message);
        try {

            const destination = options.file || posix.normalize(posix.basename(ussFileName));
            IO.createDirsSyncFromFilePath(destination);

            const writeStream = IO.createWriteStream(destination);
            ussFileName = posix.normalize(ussFileName);

            // If data type is not defined by user, check for USS tags
            if (options.binary == null && options.encoding == null) {
                await Utilities.applyTaggedEncoding(session, ussFileName, options);
            }

            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the uss file structure
            if (ussFileName.substr(0, 1) === "/") {
                ussFileName = ussFileName.substr(1);
            }

            ussFileName = encodeURIComponent(ussFileName);
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, ussFileName);

            const reqHeaders: IHeaderContent[] = ZosFilesUtils.generateHeadersBasedOnOptions(options);

            // Use specific options to mimic ZosmfRestClient.getStreamed()
            const requestOptions: IOptionsFullResponse = {
                resource: endpoint,
                reqHeaders,
                responseStream: writeStream,
                normalizeResponseNewLines: !options.binary,
                task: options.task
            };

            // If requestor needs etag, add header + get "response" back
            if (options.returnEtag) {
                requestOptions.reqHeaders.push(ZosmfHeaders.X_IBM_RETURN_ETAG);
                requestOptions.dataToReturn = [CLIENT_PROPERTY.response];
            }

            const request = await ZosmfRestClient.getExpectFullResponse(session, requestOptions);

            // By default, apiResponse is empty when downloading
            const apiResponse: any = {};

            // Return Etag in apiResponse, if requested
            if (options.returnEtag) {
                apiResponse.etag = request.response.headers.etag;
            }
            return {
                success: true,
                commandResponse: util.format(ZosFilesMessages.ussFileDownloadedSuccessfully.message, destination),
                apiResponse
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
