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

import { AbstractSession, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";

import { posix } from "path";

import { ZosmfRestClient, IHeaderContent, ZosmfHeaders } from "../../../";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { Invoke } from "../invoke";

import { IDeleteDatasetOptions } from "./doc/IDeleteDatasetOptions";
import { IDeleteVsamOptions } from "./doc/IDeleteVsamOptions";
import { IDeleteVsamResponse } from "./doc/IDeleteVsamResponse";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { IZosFilesOptions } from "../../doc/IZosFilesOptions";

/**
 * This class holds helper functions that are used to delete files through the
 * z/OSMF APIs.
 */
export class Delete {
    /**
     * Deletes a non-VSAM data set
     *
     * @param {AbstractSession}       session      z/OSMF connection info
     * @param {string}                dataSetName  The name of the data set to delete
     * @param {IDeleteDatasetOptions} [options={}] Additional options for deletion of the data set
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the deletion
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_DeleteDataSet.htm
     */
    public static async dataSet(session: AbstractSession,
                                dataSetName: string,
                                options: IDeleteDatasetOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            // Format the endpoint to send the request to
            let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES);

            if (options.volume) {
                endpoint = posix.join(endpoint, `-(${options.volume})`);
            }

            const reqHeaders: IHeaderContent[] = [];
            if (options && options.responseTimeout != null) {
                reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            endpoint = posix.join(endpoint, dataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            // Since there is a bug with the deleteExpectJSON (doesn't handle 204 no content) we will be using the expect
            // string api since that doesn't seem to complain.
            await ZosmfRestClient.deleteExpectString(session, endpoint, reqHeaders);

            return {
                success        : true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);

            throw error;
        }
    }

    /**
     * Deletes a VSAM data set
     *
     * @param {AbstractSession}           session      z/OSMF connection info
     * @param {string}                    dataSetName  The name of the VSAM data set to delete
     * @param {IDeleteVsamOptions} [options={}] Additional options for deletion of the data set
     *
     * @returns {Promise<IDeleteVsamResponse>} A response indicating the status of the deletion
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.1.0/com.ibm.zos.v2r1.idai200/delet.htm
     */
    public static async vsam(session: AbstractSession,
                             dataSetName: string,
                             options: IDeleteVsamOptions = {}): Promise<IDeleteVsamResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        // Create the control statements
        const amsControlStatements = [
            "DELETE -",
            `${dataSetName} -`,
            "CLUSTER -",
            `${options.erase ? "ERASE" : "NOERASE"} -`,
            options.purge ? "PURGE" : "NOPURGE"
        ];

        try {
            const response: IZosFilesResponse = await Invoke.ams(session, amsControlStatements, {responseTimeout: options.responseTimeout});

            return {
                success        : true,
                commandResponse: ZosFilesMessages.datasetDeletedSuccessfully.message,
                apiResponse    : response
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Deletes a USS file or directory
     *
     * @param {AbstractSession}           session      z/OSMF connection info
     * @param {string}                    fileName     The name of the file or directory to delete
     * @param {boolean}                   recursive    The indicator to delete directory recursively
     * @returns {Promise<IDeleteVsamResponse>} A response indicating the status of the deletion
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_DeleteUnixFile.htm
     */
    public static async ussFile(session: AbstractSession,
                                fileName: string,
                                recursive?: boolean,
                                options?: IZosFilesOptions): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(fileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(fileName, "", ZosFilesMessages.missingUSSFileName.message);

        // Format the endpoint to send the request to
        let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES);

        fileName = posix.normalize(fileName);
        fileName = ZosFilesUtils.formatUnixFilepath(fileName);
        fileName = encodeURIComponent(fileName);
        endpoint = posix.join(endpoint, fileName);
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        const reqHeaders: IHeaderContent[] = [];
        if (recursive && recursive === true) {
            reqHeaders.push({"X-IBM-Option": "recursive"});
        }
        if (options && options.responseTimeout != null) {
            reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }

        try {
            await ZosmfRestClient.deleteExpectString(session, endpoint, reqHeaders);
            return {
                success: true,
                commandResponse: ZosFilesMessages.ussFileDeletedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Deletes a z/OS file system
     *
     * @param {AbstractSession}           session      z/OSMF connection info
     * @param {string}                    fileSystemName     The name of the ZFS to delete
     *
     * @throws {ImperativeError} File system name must be specified as a non-empty string
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_DeleteUnixzFsFilesystem.htm
     */
    public static async zfs(session: AbstractSession,
                            fileSystemName: string,
                            options?: IZosFilesOptions): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(fileSystemName, ZosFilesMessages.missingFileSystemName.message);
        ImperativeExpect.toNotBeEqual(fileSystemName, "", ZosFilesMessages.missingFileSystemName.message);

        // Format the endpoint to send the request to
        const endpoint = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_ZFS_FILES + "/" + fileSystemName;
        const reqHeaders: IHeaderContent[] = [];
        if (options && options.responseTimeout != null) {
            reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }

        const data = await ZosmfRestClient.deleteExpectString(session, endpoint, reqHeaders);

        return {
            success: true,
            commandResponse: ZosFilesMessages.zfsDeletedSuccessfully.message,
            apiResponse: data
        };
    }
}
