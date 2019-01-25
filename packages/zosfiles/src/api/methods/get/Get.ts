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

import { posix } from "path";
import { AbstractSession, ImperativeError, ImperativeExpect, Logger, IO } from "@brightside/imperative";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosmfHeaders } from "../../../../../rest/src/ZosmfHeaders";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient } from "../../../../../rest";
import { IGetOptions } from "./doc/IGetOptions";


/**
 * This class holds helper functions that are used to get the content of data sets or USS files through the z/OSMF APIs
 * @export
 * @class Get
 */
export class Get {
    /**
     * Retrieve data sets content
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           dataSetName  - contains the data set name
     * @param {IViewOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<string>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError}
     */
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IGetOptions = {}): Promise<string> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName);

        let reqHeaders: IHeaderContent[] = [];
        if (options.binary) {
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
        }

        const content = await ZosmfRestClient.getExpectString(session, endpoint, reqHeaders);

        return content;
    }

    /**
     * Retrieve USS file content
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           USSFileName  - contains the data set name
     * @param {IViewOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<string>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError}
     */
    public static async USSFile(session: AbstractSession, USSFileName: string, options: IGetOptions = {}): Promise<string> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);

        const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, USSFileName);

        let reqHeaders: IHeaderContent[] = [];
        if (options.binary) {
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
        }

        const content = await ZosmfRestClient.getExpectString(session, endpoint, reqHeaders);

        return content;
    }
}
