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

import { ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";
import { IDataSet } from "../../doc/IDataSet";
import { ICopyDatasetOptions } from "./doc/ICopyDatasetOptions";
/**
 * This class holds helper functions that are used to copy the contents of datasets through the
 * z/OSMF APIs.
 */
export class Copy {
    /**
     * Copy the contents of a dataset
     *
     * @param {AbstractSession}   session        - z/OSMF connection info
     * @param {IDataSet}          toDataSet      - The data set to copy to
     * @param {IDataSetOptions}   options        - Options
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSet(
        session: AbstractSession,
        { dsn: toDataSetName, member: toMemberName }: IDataSet,
        options: ICopyDatasetOptions
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(options["from-dataset"].dsn, "fromDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(toDataSetName, "toDataSetName");

        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            toMemberName == null ? toDataSetName : `${toDataSetName}(${toMemberName})`
        );
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        const payload = {
            request: "copy",
            ...options
        };

        const reqHeaders: IHeaderContent[] = [
            Headers.APPLICATION_JSON,
            { [Headers.CONTENT_LENGTH]: JSON.stringify(payload).length.toString() }
        ];

        try {
            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);

            return {
                success: true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
