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

import { AbstractSession, Headers, ImperativeExpect, IO, Logger, TaskProgress, ImperativeError, TextUtils } from "@zowe/imperative";

import { posix, join, relative } from "path";
import * as fs from "fs";
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
import { IDownloadDsmResult } from "./doc/IDownloadDsmResult";
import { IDownloadUssDirResult } from "./doc/IDownloadUssDirResult";
import { IUSSListOptions } from "../list";
import { TransferMode } from "../../utils/ZosFilesAttributes";

type IZosmfListResponseWithStatus = IZosmfListResponse & { error?: Error; status?: string };

interface IDownloadDsmTask {
    handler: (session: AbstractSession, dsname: string, options: IDownloadOptions) => Promise<IZosFilesResponse>;
    dsname: string;
    options: IDownloadOptions;
    onSuccess: (response: IZosFilesResponse, options: IDownloadOptions) => void;
}

interface IDownloadUssTask {
    dirName?: string;
    file?: string;
    options?: IDownloadOptions;
}

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
        let destination: string;

        try {
            // Format the endpoint to send the request to
            let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES);

            if (options.volume) {
                endpoint = posix.join(endpoint, `-(${encodeURIComponent(options.volume)})`);
            }

            endpoint = posix.join(endpoint, encodeURIComponent(dataSetName));

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const reqHeaders: IHeaderContent[] = this.generateHeadersBasedOnOptions(options);

            // Get contents of the data set
            let extension = ZosFilesUtils.DEFAULT_FILE_EXTENSION;
            if (options.extension != null) {
                extension = options.extension;
            }

            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the data set name
            // Note that the "extension" options do not affect the destination if the "file" options were provided
            destination = (() => {
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

            if (destination != null) {
                IO.deleteFile(destination);
            }

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
                    downloadErrors.push(err);
                    failedMembers.push(fileName);
                    // Delete the file that could not be downloaded
                    IO.deleteFile(baseDir + IO.FILE_DELIM + fileName + IO.normalizeExtension(extension));
                    // If we should fail fast, rethrow error
                    if (options.failFast || options.failFast === undefined) {
                        throw err;
                    }
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
     * Download a list of data sets to local files
     *
     * @param {AbstractSession}  session         - z/OS MF connection info
     * @param {IZosmfListResponse[]} dataSetObjs - contains data set objects returned by z/OSMF List API
     * @param {IDownloadOptions} [options={}]    - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @example
     * ```typescript
     *
     * // Download a list of "PS" and "PO" datasets to the directory "./path/to/dir/"
     * await Download.allDataSets(session, [
     *    { dsname: "USER.DATA.SET.PS", dsorg: "PS" },
     *    { dsname: "USER.DATA.SET.PDS", dsorg: "PO" }
     * ], {directory: "./path/to/dir/"});
     * ```
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.2.0/com.ibm.zos.v2r2.izua700/IZUHPINFO_API_GetReadDataSet.htm
     */
    public static async allDataSets(session: AbstractSession, dataSetObjs: IZosmfListResponse[],
        options: IDownloadOptions = {}): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeEqual(dataSetObjs.length, 0, ZosFilesMessages.missingDataSets.message);
        const result = this.emptyDownloadDsmResult();
        const zosmfResponses: IZosmfListResponseWithStatus[] = [...dataSetObjs];

        try {
            // Download data sets
            const poDownloadTasks: IDownloadDsmTask[] = [];
            const psDownloadTasks: IDownloadDsmTask[] = [];
            const mutableOptions: IDownloadOptions = { ...options, task: undefined };

            for (const dataSetObj of zosmfResponses) {
                let llq = dataSetObj.dsname.substring(dataSetObj.dsname.lastIndexOf(".") + 1, dataSetObj.dsname.length);
                if (!options.preserveOriginalLetterCase) {
                    llq = llq.toLowerCase();
                }
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
                        mutableOptions.file = `${dataSetObj.dsname}.` +
                            `${mutableOptions.extension ?? ZosFilesUtils.DEFAULT_FILE_EXTENSION}`;
                        if (!options.preserveOriginalLetterCase) {
                            mutableOptions.file = mutableOptions.file.toLowerCase();
                        }
                        mutableOptions.directory = undefined;
                        mutableOptions.extension = undefined;
                    }
                } else if (dataSetObj.dsorg === "PO" || dataSetObj.dsorg === "PO-E") {
                    mutableOptions.directory = `${mutableOptions.directory}/${ZosFilesUtils.getDirsFromDataSet(dataSetObj.dsname)}`;
                } else {
                    mutableOptions.file = `${mutableOptions.directory}/${dataSetObj.dsname}.` +
                        `${mutableOptions.extension ?? ZosFilesUtils.DEFAULT_FILE_EXTENSION}`;
                    if (!options.preserveOriginalLetterCase) {
                        mutableOptions.file = mutableOptions.file.toLowerCase();
                    }
                    mutableOptions.directory = undefined;
                    mutableOptions.extension = undefined;
                }

                if (dataSetObj.error != null) {
                    result.failedWithErrors[dataSetObj.dsname] = dataSetObj.error;
                } else if (dataSetObj.dsorg == null) {
                    dataSetObj.status = `Skipped: Archived data set or alias - type ${dataSetObj.vol}.`;
                    result.failedArchived.push(dataSetObj.dsname);
                } else if (dataSetObj.dsorg === "PS") {
                    psDownloadTasks.push({
                        handler: Download.dataSet.bind(this),
                        dsname: dataSetObj.dsname,
                        options: { ...mutableOptions },
                        onSuccess: (downloadResponse) => {
                            dataSetObj.status = downloadResponse.commandResponse;
                        }
                    });
                } else if (dataSetObj.dsorg === "PO" || dataSetObj.dsorg === "PO-E") {
                    poDownloadTasks.push({
                        handler: Download.allMembers.bind(this),
                        dsname: dataSetObj.dsname,
                        options: { ...mutableOptions },
                        onSuccess: (downloadResponse, options) => {
                            dataSetObj.status = downloadResponse.commandResponse;
                            const listMembers: string[] = downloadResponse.apiResponse.items.map((item: any) => ` ${item.member}`);
                            if (listMembers.length === 0) {  // Create directory for empty PO data set
                                IO.createDirsSyncFromFilePath(options.directory);
                            } else {
                                dataSetObj.status += `\nMembers: ${listMembers};`;
                            }
                        }
                    });
                } else {
                    dataSetObj.status = `Skipped: Unsupported data set - type ${dataSetObj.dsorg}.`;
                    result.failedUnsupported.push(dataSetObj.dsname);
                }
                mutableOptions.directory = options.directory;
            }

            // If we should fail fast, throw error
            if ((result.failedArchived.length > 0 || result.failedUnsupported.length > 0 ||
                Object.keys(result.failedWithErrors).length > 0) && options.failFast !== false) {
                throw new ImperativeError({
                    msg: ZosFilesMessages.failedToDownloadDataSets.message,
                    additionalDetails: this.buildDownloadDsmResponse(result, options)
                });
            }

            let downloadsInitiated = 0;
            const createDownloadPromise = (task: IDownloadDsmTask) => {
                if (options.task != null) {
                    options.task.statusMessage = "Downloading data set " + task.dsname;
                    options.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (downloadsInitiated / (poDownloadTasks.length + psDownloadTasks.length)));
                    downloadsInitiated++;
                }

                return task.handler(session, task.dsname, task.options).then(
                    (downloadResponse) => {
                        result.downloaded.push(task.dsname);
                        task.onSuccess(downloadResponse, task.options);
                    },
                    (err) => {
                        result.failedWithErrors[task.dsname] = err;
                        // If we should fail fast, rethrow error
                        if (options.failFast || options.failFast === undefined) {
                            throw new ImperativeError({
                                msg: `Failed to download ${task.dsname}`,
                                causeErrors: err,
                                additionalDetails: this.buildDownloadDsmResponse(result, options)
                            });
                        }
                    }
                );
            };

            // First download the partitioned data sets
            // We execute the promises sequentially to make sure that
            // we do not exceed `--mcr` when downloading multiple members
            for (const task of poDownloadTasks) {
                await createDownloadPromise(task);
            }

            // Next download the sequential data sets in a pool
            const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;
            if (maxConcurrentRequests === 0) {
                await Promise.all(psDownloadTasks.map(createDownloadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, psDownloadTasks, createDownloadPromise);
            }
        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }

        // Handle failed downloads if no errors were thrown yet
        if (Object.keys(result.failedWithErrors).length > 0) {
            throw new ImperativeError({
                msg: ZosFilesMessages.datasetDownloadFailed.message + Object.keys(result.failedWithErrors).join("\n"),
                causeErrors: Object.values(result.failedWithErrors),
                additionalDetails: this.buildDownloadDsmResponse(result, options)
            });
        }

        const numFailed = result.failedArchived.length + result.failedUnsupported.length + Object.keys(result.failedWithErrors).length;
        return {
            success: numFailed === 0,
            commandResponse: this.buildDownloadDsmResponse(result, options),
            apiResponse: zosmfResponses,
            errorMessage: numFailed > 0 ? ZosFilesMessages.someDownloadsFailed.message : undefined
        };
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

            // If data type is not defined by user, check for USS tags
            if (options.binary == null && options.encoding == null) {
                await Utilities.applyTaggedEncoding(session, ussFileName, options);
            }

            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the uss file structure
            ussFileName = ZosFilesUtils.sanitizeUssPathForRestCall(ussFileName);
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, ussFileName);

            const reqHeaders: IHeaderContent[] = this.generateHeadersBasedOnOptions(options);

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

    /**
     * Retrieve USS file content and save it in your local workspace.
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           ussDirName  - contains the USS file name
     * @param {IDownloadOptions} [fileOptions={}] - contains the file options to be sent
     * @param {IUSSListOptions}  [listOptions={}] - contains the uss list options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} USS file name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */
    public static async ussDir(session: AbstractSession, ussDirName: string,
        fileOptions: IDownloadOptions = {}, listOptions: IUSSListOptions = {}): Promise<IZosFilesResponse> {

        // required
        ImperativeExpect.toNotBeNullOrUndefined(ussDirName, ZosFilesMessages.missingUSSDirName.message);
        ImperativeExpect.toNotBeEqual(ussDirName.trim(), "", ZosFilesMessages.missingUSSDirName.message);
        ImperativeExpect.toNotBeEqual(fileOptions.record, true, ZosFilesMessages.unsupportedDataType.message);
        const result = this.emptyDownloadUssDirResult();
        const workingDirectory = fileOptions.directory ? fileOptions.directory : process.cwd();
        const responses: IZosFilesResponse[] = [];
        const downloadTasks: IDownloadUssTask[] = [];
        let downloadsInitiated = 0;
        let downloadsTotal = 0;

        const createPromise = (task: IDownloadUssTask) => {
            if (task.file) {
                return createFilePromise(task);
            } else {
                return createDirPromise(task);
            }
        };

        const createFilePromise = (task: IDownloadUssTask) => {
            if (fileOptions.task != null) {
                fileOptions.task.statusMessage = "Downloading file: " + task.file;
                fileOptions.task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT * (downloadsInitiated / downloadsTotal));
                downloadsInitiated++;
            }
            // task.options.file is only null for directories, but we may want to fall back to the filename itself (just in case)
            if (fs.existsSync(task.options?.file ?? task.file) && !fileOptions.overwrite) {
                result.skippedExisting.push(task.file);
            } else {
                return this.ussFile(session, posix.join(ussDirName, task.file), task.options).then(
                    (downloadResponse) => {
                        responses.push(downloadResponse);
                        result.downloaded.push(task.file);
                    }, (err) => {
                        result.failedWithErrors[task.file] = err;
                        if (fileOptions.failFast || fileOptions.failFast === undefined) {
                            throw new ImperativeError({
                                msg: `Failed to download ${task.file}`,
                                causeErrors: err,
                                additionalDetails: this.buildDownloadUssDirResponse(result, fileOptions)
                            });
                        }
                    }
                );
            }
        };

        const createDirPromise = (task: IDownloadUssTask) => {
            return fs.promises.mkdir(task.dirName, { recursive: true }).then(
                () => {
                    result.downloaded.push(task.dirName);
                }, (err) => {
                    const relDirName = relative(workingDirectory, task.dirName);
                    result.failedWithErrors[relDirName] = err;
                    if (fileOptions.failFast || fileOptions.failFast === undefined) {
                        throw new ImperativeError({
                            msg: `Failed to create directory ${relDirName}`,
                            causeErrors: err,
                            additionalDetails: this.buildDownloadUssDirResponse(result, fileOptions)
                        });
                    }
                }
            );
        };

        try {
            const mutableOptions: IDownloadOptions = { ...fileOptions, task: undefined };

            // Populate list options
            listOptions = {name: "*", ...listOptions};

            // Get the directory listing from z/OSMF
            const list = (await List.fileList(session, ussDirName, listOptions)).apiResponse.items;

            // For each item in the listing...
            for (const item of list) {
                if (item.name === "." || item.name === ".." || item.name === "..." || (!fileOptions.includeHidden && /(^|\/)\./.test(item.name))) {
                    // If the name is ., .., ..., or a hidden file, ignore it.
                    continue;
                } else if (item.mode.startsWith("-")) {
                    // If mode starts with -, the item is a file, download it
                    if (fileOptions.attributes?.fileShouldBeIgnored(item.name)) {
                        // If .zosattributes says to ignore the file, skip it
                        continue;
                    }
                    mutableOptions.file = join(workingDirectory, item.name);
                    downloadTasks.push({
                        file: item.name,
                        options: {
                            ...mutableOptions,
                            ...this.parseAttributeOptions(item.name, fileOptions)
                        },
                    });
                    downloadsTotal++;
                } else if (item.mode.startsWith("d")) {
                    // If mode starts with d, the item is a directory, create it
                    downloadTasks.push({
                        dirName: join(workingDirectory, item.name),
                    });
                }
                // Otherwise, skip it entirely.
            }

            // Next download the USS files in a pool
            const maxConcurrentRequests = fileOptions.maxConcurrentRequests == null ? 1 : fileOptions.maxConcurrentRequests;
            if (maxConcurrentRequests === 0) {
                await Promise.all(downloadTasks.map(createPromise));
            } else {
                await asyncPool(maxConcurrentRequests, downloadTasks, createPromise);
            }

            return {
                success: Object.keys(result.failedWithErrors).length === 0,
                commandResponse: this.buildDownloadUssDirResponse(result, fileOptions),
                apiResponse: responses
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Create an empty download data sets matching result.
     * @returns Results object with all lists initialized as empty
     */
    private static emptyDownloadDsmResult(): IDownloadDsmResult {
        return {
            downloaded: [],
            failedArchived: [],
            failedUnsupported: [],
            failedWithErrors: {}
        };
    }

    /**
     * Create an empty download data sets matching result.
     * @returns Results object with all lists initialized as empty
     */
    private static emptyDownloadUssDirResult(): IDownloadUssDirResult {
        return {
            downloaded: [],
            skippedExisting: [],
            failedWithErrors: {}
        };
    }

    /**
     * Build a response string from a download data sets matching result.
     * @param result Result object from the download API
     * @param options Options passed to the download API
     * @returns Response string to print to console
     */
    private static buildDownloadDsmResponse(result: IDownloadDsmResult, options: IDownloadOptions = {}): string {
        const failedDsnames = Object.keys(result.failedWithErrors);
        const numFailed = result.failedArchived.length + result.failedUnsupported.length + failedDsnames.length;
        const responseLines = [];

        if (result.downloaded.length > 0) {
            responseLines.push(TextUtils.chalk.green(`${result.downloaded.length} data set(s) downloaded successfully to `) +
                (options.directory ?? "./"));
        }

        if (numFailed > 0) {
            responseLines.push(TextUtils.chalk.red(`${numFailed} data set(s) failed to download:`));
            if (result.failedArchived.length > 0) {
                responseLines.push(
                    TextUtils.chalk.yellow(`${result.failedArchived.length} failed because they are archived`),
                    ...result.failedArchived.map(dsname => `    ${dsname}`)
                );
            }
            if (result.failedUnsupported.length > 0) {
                responseLines.push(
                    TextUtils.chalk.yellow(`${result.failedUnsupported.length} failed because they are an unsupported type`),
                    ...result.failedUnsupported.map(dsname => `    ${dsname}`)
                );
            }
            if (failedDsnames.length > 0) {
                responseLines.push(
                    TextUtils.chalk.yellow(`${failedDsnames.length} failed because of an uncaught error`),
                    ...failedDsnames.map(dsname => `    ${dsname}`),
                    "",
                    ...Object.values(result.failedWithErrors).map((err: Error) => err.message)
                );
            }
            if (options.failFast !== false) {
                responseLines.push(
                    "\nSome data sets may have been skipped because --fail-fast is true.",
                    "To ignore errors and continue downloading, rerun the command with --fail-fast set to false."
                );
            }
        }

        return responseLines.join("\n") + "\n";
    }

    /**
     * Build a response string from a download ussDir result.
     * @param result Result object from the download API
     * @param options Options passed to the download API
     * @returns Response string to print to console
     */
    private static buildDownloadUssDirResponse(result: IDownloadUssDirResult, options: IDownloadOptions = {}): string {
        const failedFiles = Object.keys(result.failedWithErrors);
        const numFailed = failedFiles.length;
        const responseLines = [];

        if (result.downloaded.length > 0) {
            responseLines.push(TextUtils.chalk.green(`${result.downloaded.length} file(s) downloaded successfully to `) +
                (options.directory ?? "./"));
        }

        if (result.skippedExisting.length > 0) {
            responseLines.push(
                TextUtils.chalk.yellow(`${result.skippedExisting.length} file(s) skipped because they already exist.`),
                ...result.skippedExisting.map(filename => `    ${filename}`),
                "\nRerun the command with --overwrite to download the files listed above."
            );
        }

        if (numFailed > 0) {
            responseLines.push(TextUtils.chalk.red(`${numFailed} file(s) failed to download:`));
            if (failedFiles.length > 0) {
                responseLines.push(
                    TextUtils.chalk.yellow(`${failedFiles.length} failed because of an uncaught error`),
                    ...failedFiles.map(filename => `    ${filename}`),
                    "",
                    ...Object.values(result.failedWithErrors).map((err: Error) => err.message)
                );
            }
            if (options.failFast !== false) {
                responseLines.push(
                    "\nSome files may have been skipped because --fail-fast is true.",
                    "To ignore errors and continue downloading, rerun the command with --fail-fast set to false."
                );
            }
        }
        return responseLines.join("\n") + "\n";
    }

    private static generateHeadersBasedOnOptions(options: IDownloadOptions) {
        const reqHeaders = ZosFilesUtils.generateHeadersBasedOnOptions(options);
        if (!options.binary && !options.record) {
            if (options.localEncoding) {
                reqHeaders.push({ [Headers.CONTENT_TYPE]: options.localEncoding });
            } else {
                reqHeaders.push(ZosmfHeaders.TEXT_PLAIN);
            }
        }
        return reqHeaders;
    }

    private static parseAttributeOptions(filename: string, options: IDownloadOptions): Partial<IDownloadOptions> {
        const newOptions: Partial<IDownloadOptions> = {};
        if (options.attributes != null) {
            newOptions.binary = options.attributes.getFileTransferMode(filename, options.binary) === TransferMode.BINARY;
            if (!newOptions.binary) {
                newOptions.encoding = options.attributes.getRemoteEncoding(filename);
                newOptions.localEncoding = options.attributes.getLocalEncoding(filename);
            }
        }
        return newOptions;
    }
}
