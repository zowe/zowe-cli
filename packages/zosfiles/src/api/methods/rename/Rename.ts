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

import { ZosmfRestClient, IHeaderContent } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";

/**
 * Class to handle renaming data sets
 */
export class Rename {
    /**
     * Rename a data set
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} beforeDataSetName                    - the name of the data set to rename
     * @param {string} afterDataSetName                     - the new name of the data set
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dataSet(
        session: AbstractSession,
        beforeDataSetName: string,
        afterDataSetName: string,
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(beforeDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(beforeDataSetName, "", ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeNullOrUndefined(afterDataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(afterDataSetName, "", ZosFilesMessages.missingDatasetName.message);

        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            afterDataSetName,
        );
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        const payload: any = {
            "request": "rename",
            "from-dataset": {
                dsn: beforeDataSetName,
            },
        };

        const reqHeaders: IHeaderContent[] = [
            Headers.APPLICATION_JSON,
            { [Headers.CONTENT_LENGTH]: JSON.stringify(payload).length.toString() },
        ];

        try {
            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);
            return {
                success: true,
                commandResponse: ZosFilesMessages.dataSetRenamedSuccessfully.message
            };
        } catch(err) {
            Logger.getAppLogger().error(err);
            throw err;
        }
    }
}
