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

import { AbstractSession, ImperativeExpect, Logger, Headers } from "@zowe/imperative";
import { posix } from "path";

import { ZosmfRestClient, ZosmfHeaders } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";
import { ICopyDatasetOptions, enqueue } from ".";
/**
 * This class holds helper functions that are used to copy the contents of datasets through the
 * z/OSMF APIs.
 */
export class Copy {
    /**
     * Copy a sequential dataset
     *
     * @param {AbstractSession}       session      z/OSMF connection info
     * @param {string}                fromDataSetName  The name of the data set to copy from
     * @param {string}                toDataSetName  The name of the data set to copy to
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSet(session: AbstractSession,
                                fromDataSetName: string,
                                toDataSetName: string,
                                options: Partial<ICopyDatasetOptions> = {}): Promise<IZosFilesResponse> {

        ImperativeExpect.toNotBeNullOrUndefined(fromDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(fromDataSetName, "", ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeNullOrUndefined(toDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(toDataSetName, "", ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(options.enq, enqueue.SHRW, ZosFilesMessages.unsupportedDatasetType.message);

        try {
            let endpoint: string = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
            );

            if (options.toVolume) {
                endpoint = posix.join(endpoint, `-(${options.toVolume})`);
            }

            endpoint = posix.join(endpoint, toDataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const payload = {
                "request": "copy",
                "from-dataset": {
                    dsn: fromDataSetName,
                }
            } as any;

            if(options.fromVolume) {
                payload["from-dataset"].volser = options.fromVolume;
            }

            if (options.enq) {
                payload.enq = options.enq;
            }

            if (options.alias !== undefined) {
                payload.alias = options.alias;
            }

            const reqHeaders: IHeaderContent[] = [
                Headers.APPLICATION_JSON,
                { [ Headers.CONTENT_LENGTH ] : JSON.stringify(payload).length.toString() }
            ];

            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);

            return {
                success        : true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Copy a dataset member
     *
     * @param {AbstractSession}       session      z/OSMF connection info
     * @param {string}                fromDataSetName  The name of the dataset to copy from
     * @param {string}                fromMemberName  The name of the dataset member to copy from
     * @param {string}                toDataSetName  The name of the dataset to copy to
     * @param {string}                toDataSetMemberName  The name of the dataset member to copy to
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSetMember(
        session: AbstractSession,
        fromDataSetName: string,
        fromMemberName: string,
        toDataSetName: string,
        toMemberName: string,
        options: Partial<ICopyDatasetOptions> = {}): Promise<IZosFilesResponse> {

        ImperativeExpect.toNotBeNullOrUndefined(fromDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(fromDataSetName, "", ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeNullOrUndefined(toDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(toDataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            let endpoint: string = posix.join(
                ZosFilesConstants.RESOURCE,
                ZosFilesConstants.RES_DS_FILES,
            );
            if (options.toVolume) {
                endpoint = posix.join(endpoint, `-(${options.toVolume})`);
            }
            endpoint = posix.join(endpoint, `${toDataSetName}(${toMemberName})`);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const payload = {
                "request": "copy",
                "from-dataset": {
                    dsn: fromDataSetName,
                    member: fromMemberName,
                }
            } as any;

            if(options.fromVolume) {
                payload["from-dataset"].volser = options.fromVolume;
            }

            if (options.replace) {
                payload.replace = options.replace;
            }

            if (options.enq) {
                payload.enq = options.enq;
            }

            const reqHeaders: IHeaderContent[] = [
                Headers.APPLICATION_JSON,
                { [ Headers.CONTENT_LENGTH ] : JSON.stringify(payload).length.toString() }
            ];

            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);

            return {
                success        : true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
