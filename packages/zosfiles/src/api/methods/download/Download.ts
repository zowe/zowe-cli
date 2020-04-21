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

import { AbstractSession, ImperativeExpect, IO, Logger, TaskProgress } from "@zowe/imperative";

import { posix } from "path";
import * as util from "util";

import { ZosmfRestClient } from "../../../../../rest";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";
import { ZosmfHeaders } from "../../../../../rest/src/ZosmfHeaders";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { List } from "../list/List";
import { IDownloadOptions } from "./doc/IDownloadOptions";
import { Get } from "../get/Get";
import { asyncPool } from "../../../../../utils";
import { IGetOptions } from "../get";
import { Writable } from "stream";
import { IRestClientResponse } from "../../doc/IRestClientResponse";
import { CLIENT_PROPERTY } from "../../doc/types/ZosmfRestClientProperties";
import { IOptionsFullResponse } from "../../doc/IOptionsFullResponse";

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

            let reqHeaders: IHeaderContent[] = [];
            if (options.binary) {
                reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
            }

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
                normalizeResponseNewLines: !options.binary,
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
                volume: options.volume
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
                    binary: options.binary
                });
            };

            const maxConcurrentRequests = options.maxConcurrentRequests == null ? 1 : options.maxConcurrentRequests;

            if (maxConcurrentRequests === 0) {
                await Promise.all(memberList.map(createDownloadPromise));
            } else {
                await asyncPool(maxConcurrentRequests, memberList, createDownloadPromise);
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
        try {

            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the uss file structure
            if (ussFileName.substr(0, 1) === "/") {
                ussFileName = ussFileName.substr(1);
            }

            const destination = options.file || posix.normalize(posix.basename(ussFileName));
            IO.createDirsSyncFromFilePath(destination);

            const writeStream = IO.createWriteStream(destination);
            ussFileName = posix.normalize(ussFileName);
            // Get a proper destination for the file to be downloaded
            // If the "file" is not provided, we create a folder structure similar to the uss file structure
            if (ussFileName.substr(0, 1) === "/") {
                ussFileName = ussFileName.substr(1);
            }

            ussFileName = encodeURIComponent(ussFileName);
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, ussFileName);

            let reqHeaders: IHeaderContent[] = [];
            if (options.binary) {
                reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
            }

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

