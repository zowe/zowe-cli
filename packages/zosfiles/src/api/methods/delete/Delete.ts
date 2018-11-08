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

import { AbstractSession, ImperativeError, ImperativeExpect, Logger } from "@brightside/imperative";

import { posix } from "path";

import { ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { Invoke } from "../invoke";

import { IDeleteDatasetOptions } from "./doc/IDeleteDatasetOptions";
import { IDeleteVsamOptions } from "./doc/IDeleteVsamOptions";
import { IDeleteVsamResponse } from "./doc/IDeleteVsamResponse";

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

            endpoint = posix.join(endpoint, dataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            // Since there is a bug with the deleteExpectJSON (doesn't handle 204 no content) we will be using the expect
            // string api since that doesn't seem to complain.
            await ZosmfRestClient.deleteExpectString(session, endpoint);

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
            const response: IZosFilesResponse = await Invoke.ams(session, amsControlStatements);

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
}
