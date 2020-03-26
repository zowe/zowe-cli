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

import { AbstractSession, ImperativeExpect, Logger, IHeaderContent, Headers } from "@zowe/imperative";

import { posix } from "path";

import { ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IMigrateOptions } from "./doc/IMigrateOptions";

/**
 * This class holds helper functions that are used to recall files through the
 * z/OSMF APIs.
 */
export class HMigrate {
    /**
     *
     * @param {AbstractSession}       session      z/OSMF connection info
     * @param {string}                dataSetName  The name of the data set to recall
     * @param {boolean}               wait If true then the function waits for completion of the request. If false (default) the request is queued.
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the migrating
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSet(session: AbstractSession,
                                dataSetName: string,
                                options: Partial<IMigrateOptions> = {}): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        try {
            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName);

            Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

            const payload = { request: "hmigrate" } as any;

            if(options.wait != null) {
                payload.wait = options.wait;
            }

            const headers: IHeaderContent[] = [
              Headers.APPLICATION_JSON,
              { "Content-Length": JSON.stringify(payload).length.toString() }
            ];

            await ZosmfRestClient.putExpectString(session, endpoint, headers, payload);

            return {
                success        : true,
                commandResponse: ZosFilesMessages.datasetMigratedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
