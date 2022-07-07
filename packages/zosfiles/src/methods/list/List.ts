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

import { AbstractSession, IHeaderContent, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";

import { posix } from "path";

import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IListOptions } from "./doc/IListOptions";
import { IUSSListOptions } from "./doc/IUSSListOptions";
import { IFsOptions } from "./doc/IFsOptions";

/**
 * This class holds helper functions that are used to list data sets and its members through the z/OS MF APIs
 */
export class List {
    /**
     * Retrieve all members from a PDS
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           dataSetName  - contains the data set name
     * @param {IListOptions}     [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_GetListDataSetMembers.htm
     */
    public static async allMembers(session: AbstractSession, dataSetName: string, options: IListOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            // Format the endpoint to send the request to
            let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName, ZosFilesConstants.RES_DS_MEMBERS);

            if (options.pattern) {
                endpoint += `?pattern=${options.pattern}`;
            }

            const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            if (options.attributes) {
                reqHeaders.push(ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
            }
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
            }
            if (options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            this.log.debug(`Endpoint: ${endpoint}`);

            const response: any = await ZosmfRestClient.getExpectJSON(session, endpoint, reqHeaders);

            return {
                success: true,
                commandResponse: null,
                apiResponse: response
            };
        } catch (error) {
            this.log.error(error);
            throw error;
        }
    }

    /**
     * Retrieve all members from a data set name
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           dataSetName  - contains the data set name
     * @param {IListOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IListOptions = {}): Promise<IZosFilesResponse> {

        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            let endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dataSetName}`);
            if (options.volume) {
                endpoint = `${endpoint}&volser=${options.volume}`;
            }
            if (options.start) {
                endpoint = `${endpoint}&start=${options.start}`;
            }

            const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            if (options.attributes) {
                reqHeaders.push(ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
            }
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
            }
            if (options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            // Migrated recall options
            if (options.recall) {
                switch (options.recall.toLowerCase()) {
                    case "wait":
                        reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT);
                        break;
                    case "nowait":
                        reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT);
                        break;
                    case "error":
                        reqHeaders.push(ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR);
                        break;
                }
            }

            this.log.debug(`Endpoint: ${endpoint}`);

            const response: any = await ZosmfRestClient.getExpectJSON(session, endpoint, reqHeaders);

            return {
                success: true,
                commandResponse: null,
                apiResponse: response
            };
        } catch (error) {
            this.log.error(error);
            throw error;
        }
    }

    /**
     * Retrieve a list of all files from a path name
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {string}           path         - contains the uss path name
     * @param {IUSSListOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */
    public static async fileList(session: AbstractSession, path: string, options: IUSSListOptions = {}): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(path, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(path.trim(), "", ZosFilesMessages.missingUSSFileName.message);

        // Error out if someone tries to use a second table parameter without specifying a first table parameter
        if (options.depth || options.filesys != null || options.symlinks != null){
            if (!(options.group || options.user || options.name || options.size || options.mtime || options.perm || options.type)) {
                throw new ImperativeError({msg: "Options 'depth', 'filesys' and 'symlinks' require a 'group', 'user', 'name', 'size " +
                    "'mtime', 'perm', or 'type' option to be specified."});
            }
        }

        // Remove a trailing slash from the path, if one exists
        // Do not remove if requesting the root directory
        if (path.trim().length > 1 && path.endsWith("/")) { path = path.slice(0, -1); }

        try {
            let endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_USS_FILES}?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(path)}`);

            const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
            }
            if (options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            // Start modifying the endpoint with the query parameters that were passed in
            if (options.group) { endpoint += `&${ZosFilesConstants.RES_GROUP}=${encodeURIComponent(options.group)}`; }
            if (options.user) { endpoint += `&${ZosFilesConstants.RES_USER}=${encodeURIComponent(options.user)}`; }
            if (options.name) { endpoint += `&${ZosFilesConstants.RES_NAME}=${encodeURIComponent(options.name)}`; }
            if (options.size) { endpoint += `&${ZosFilesConstants.RES_SIZE}=${encodeURIComponent(options.size)}`; }
            if (options.mtime) { endpoint += `&${ZosFilesConstants.RES_MTIME}=${encodeURIComponent(options.mtime)}`; }
            if (options.perm) { endpoint += `&${ZosFilesConstants.RES_PERM}=${encodeURIComponent(options.perm)}`; }
            if (options.type) { endpoint += `&${ZosFilesConstants.RES_TYPE}=${encodeURIComponent(options.type)}`; }
            if (options.depth) { endpoint += `&${ZosFilesConstants.RES_DEPTH}=${encodeURIComponent(options.depth)}`; }
            if (options.filesys != null) {
                if (options.filesys === true) { endpoint += `&${ZosFilesConstants.RES_FILESYS}=all`; }
                else { endpoint += `&${ZosFilesConstants.RES_FILESYS}=same`; }
            }
            if (options.symlinks != null) {
                if (options.symlinks === true) { endpoint += `&${ZosFilesConstants.RES_SYMLINKS}=report`; }
                else { endpoint += `&${ZosFilesConstants.RES_SYMLINKS}=follow`; }
            }

            this.log.debug(`Endpoint: ${endpoint}`);

            const response: any = await ZosmfRestClient.getExpectJSON(session, endpoint, reqHeaders);

            return {
                success: true,
                commandResponse: null,
                apiResponse: response
            };
        } catch (error) {
            this.log.error(error);
            throw error;
        }
    }

    /**
     * Retrieve zfs files
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {IZfsOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */
    public static async fs(session: AbstractSession, options: IFsOptions = {}): Promise<IZosFilesResponse> {
        try {
            let endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_MFS}`);
            if (options.fsname) {
                endpoint = posix.join(endpoint, `?${ZosFilesConstants.RES_FSNAME}=${encodeURIComponent(options.fsname)}`);
            }

            const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            // if (options.path) {
            //     reqHeaders.push(ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
            // }
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
            }
            if (options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            this.log.debug(`Endpoint: ${endpoint}`);

            const response: any = await ZosmfRestClient.getExpectJSON(session, endpoint, reqHeaders);

            return {
                success: true,
                commandResponse: null,
                apiResponse: response
            };
        } catch (error) {
            this.log.error(error);
            throw error;
        }
    }

    /**
     * Retrieve zfs files if indicated path
     *
     * @param {AbstractSession}  session      - z/OS MF connection info
     * @param {IZfsOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} data set name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     */

    public static async fsWithPath(session: AbstractSession, options: IFsOptions = {}): Promise<IZosFilesResponse> {
        try {
            let endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_MFS}`);
            if (options.path) {
                endpoint = posix.join(endpoint, `?${ZosFilesConstants.RES_PATH}=${encodeURIComponent(options.path)}`);
            }

            const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
            }
            if (options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            this.log.debug(`Endpoint: ${endpoint}`);

            const response: any = await ZosmfRestClient.getExpectJSON(session, endpoint, reqHeaders);

            return {
                success: true,
                commandResponse: null,
                apiResponse: response
            };
        } catch (error) {
            this.log.error(error);
            throw error;
        }
    }

    private static get log() {
        return Logger.getAppLogger();
    }
}
