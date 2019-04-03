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

import { posix } from "path";
import { AbstractSession, ImperativeError, ImperativeExpect } from "@zowe/imperative";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosmfHeaders } from "../../../../../rest/src/ZosmfHeaders";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient } from "../../../../../rest";
import { IGetOptions } from "./doc/IGetOptions";
import { Writable } from "stream";


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
     * @returns {Promise<Buffer>} Promise that resolves to the content of the data set
     *
     * @throws {ImperativeError}
     */
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IGetOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName);

        let reqHeaders: IHeaderContent[] = [];
        if (options.binary) {
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
        }

        if (options.volume) {
            endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${options.volume})`, dataSetName);
        }


        const content = await ZosmfRestClient.getExpectBuffer(session, endpoint, reqHeaders);

        return content;
    }

    /**
     * Retrieve USS file content
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           USSFileName  - contains the data set name
     * @param {IViewOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<Buffer>} Promise that resolves to the content of the uss file
     *
     * @throws {ImperativeError}
     */
    public static async USSFile(session: AbstractSession, USSFileName: string, options: IGetOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        USSFileName = posix.normalize(USSFileName);
        // Get a proper destination for the file to be downloaded
        // If the "file" is not provided, we create a folder structure similar to the uss file structure
        if (USSFileName.substr(0, 1) === "/") {
            USSFileName = USSFileName.substr(1);
        }

        USSFileName = encodeURIComponent(USSFileName);
        const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, USSFileName);

        let reqHeaders: IHeaderContent[] = [];
        if (options.binary) {
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
        }

        const content = await ZosmfRestClient.getExpectBuffer(session, endpoint, reqHeaders);

        return content;
    }

    /**
     * Retrieve USS file content
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           USSFileName  - contains the data set name
     * @param {IViewOptions} [options={}] - contains the options to be sent
     *
     * @param responseStream
     * @returns {Promise<Buffer>} Promise that resolves to the content of the uss file
     *
     * @throws {ImperativeError}
     */
    public static async USSFileStreamed(session: AbstractSession, USSFileName: string,
                                        options: IGetOptions = {}, responseStream: Writable): Promise<string> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        USSFileName = posix.normalize(USSFileName);
        // Get a proper destination for the file to be downloaded
        // If the "file" is not provided, we create a folder structure similar to the uss file structure
        if (USSFileName.substr(0, 1) === "/") {
            USSFileName = USSFileName.substr(1);
        }

        USSFileName = encodeURIComponent(USSFileName);
        const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, USSFileName);

        let reqHeaders: IHeaderContent[] = [];
        if (options.binary) {
            reqHeaders = [ZosmfHeaders.X_IBM_BINARY];
        }

        return ZosmfRestClient.getStreamed(session, endpoint, reqHeaders, responseStream);
    }
}
