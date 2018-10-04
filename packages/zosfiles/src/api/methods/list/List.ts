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

import { AbstractSession, IHeaderContent, ImperativeError, ImperativeExpect, Logger } from "@brightside/imperative";

import { posix } from "path";

import { ZosmfRestClient } from "../../../../../rest";
import { ZosmfHeaders } from "../../../../../rest/src/ZosmfHeaders";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IListOptions } from "./doc/IListOptions";

/**
 * This class holds helper functions that are used to list data sets and its members through the z/OS MF APIs
 */
export class List {
    /**
     * Retrieve all members from a PDS
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
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_GetListDataSetMembers.htm
     */
    public static async allMembers(session: AbstractSession, dataSetName: string, options: IListOptions = {}): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            // Format the endpoint to send the request to
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName, ZosFilesConstants.RES_DS_MEMBERS);

            let reqHeaders: IHeaderContent[] = [];
            if (options.attributes) {
                reqHeaders = [ZosmfHeaders.X_IBM_ATTRIBUTES_BASE];
            }
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
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
     * @param {IDownloadOptions} [options={}] - contains the options to be sent
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
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dataSetName}`);

            const reqHeaders: IHeaderContent[] = [];
            if (options.attributes) {
                reqHeaders.push(ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
            }
            if (options.maxLength) {
                reqHeaders.push({"X-IBM-Max-Items": `${options.maxLength}`});
            } else {
                reqHeaders.push(ZosmfHeaders.X_IBM_MAX_ITEMS);
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
