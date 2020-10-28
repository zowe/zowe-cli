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

import { AbstractSession } from "@zowe/imperative";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IMigrateOptions } from "./doc/IMigrateOptions";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";

/**
 * This class holds helper functions that are used to migrate data sets through the
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
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSet(
        session: AbstractSession,
        dataSetName: string,
        options: Partial<IMigrateOptions> = {}
    ): Promise<IZosFilesResponse> {
        return ZosFilesUtils.dfsmsHsmCommand(
            session,
            dataSetName,
            ZosFilesMessages.datasetMigrationRequested.message,
            { request: "hmigrate" },
            options
        );
    }
}
