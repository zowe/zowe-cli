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
import { AbstractSession, ImperativeExpect } from "@zowe/imperative";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient, ZosmfHeaders, IHeaderContent } from "@zowe/core-for-zowe-sdk";
import { IEditOptions } from "./doc/IEditOptions";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";

/**
 * This class holds helper functions that are used to edit the content of data sets or USS files through the z/OSMF APIs
 * @export
 * @class Get
 */
export class Edit {
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
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IEditOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dataSetName);

        const reqHeaders: IHeaderContent[] = ZosFilesUtils.generateHeadersBasedOnOptions(options);

        if (options.range) {
            reqHeaders.push({"X-IBM-Record-Range": options.range});
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
    public static async USSFile(session: AbstractSession, USSFileName: string, options: IEditOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(options.record, true, ZosFilesMessages.unsupportedDataType.message);
        USSFileName = posix.normalize(USSFileName);
        // Get a proper destination for the file to be downloaded
        // If the "file" is not provided, we create a folder structure similar to the uss file structure
        if (USSFileName.substr(0, 1) === "/") {
            USSFileName = USSFileName.substr(1);
        }

        const encodedFileName = encodeURIComponent(USSFileName);
        const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, encodedFileName);

        const reqHeaders: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];

        if (options.binary === true) {
            reqHeaders.unshift(ZosmfHeaders.X_IBM_BINARY);
        }
        const content = await ZosmfRestClient.getExpectBuffer(session, endpoint, reqHeaders);

        return content;
    }
}
