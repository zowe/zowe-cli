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

import { PassThrough } from "stream";
import { buffer } from 'stream/consumers';
import { AbstractSession, ImperativeExpect } from "@zowe/imperative";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { Download } from "../download/Download";
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
     * @param {IGetOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<Buffer>} Promise that resolves to the content of the data set
     *
     * @throws {ImperativeError}
     */
    public static async dataSet(session: AbstractSession, dataSetName: string, options: IGetOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeEqual(dataSetName, "", ZosFilesMessages.missingDatasetName.message);

        const responseStream = new PassThrough();
        await Download.dataSet(session, dataSetName, {
            ...options,
            stream: responseStream
        });
        return buffer(responseStream);
    }

    /**
     * Retrieve USS file content
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           USSFileName  - contains the data set name
     * @param {IGetOptions} [options={}] - contains the options to be sent
     *
     * @returns {Promise<Buffer>} Promise that resolves to the content of the uss file
     *
     * @throws {ImperativeError}
     */
    public static async USSFile(session: AbstractSession, USSFileName: string, options: IGetOptions = {}): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(options.record, true, ZosFilesMessages.unsupportedDataType.message); // This should never exist for USS files

        const responseStream = new PassThrough();
        await Download.ussFile(session, USSFileName, {
            ...options,
            stream: responseStream
        });
        return buffer(responseStream);
    }
}
