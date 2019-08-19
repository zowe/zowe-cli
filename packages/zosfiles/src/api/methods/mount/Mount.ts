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

import { AbstractSession, ImperativeExpect } from "@zowe/imperative";

import { IMountFsOptions } from "./doc/IMountFsOptions";
import { isNullOrUndefined } from "util";
import { ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";

/**
 * This class holds helper functions that are used to mount file systems through the z/OS MF APIs
 */
export class Mount {
    /**
     * Mount a Unix file system
     *
     * @param {AbstractSession}  session         - z/OS MF connection info
     * @param {string}           fileSystemName  - contains the file system name
     * @param {IListOptions}     [options={}]    - contains the options to be sent
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} file system name must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_MountUnixFile.htm
     */
    public static async fs(
        session: AbstractSession,
        fileSystemName: string,
        options?: Partial<IMountFsOptions>)
        : Promise<IZosFilesResponse> {
        // We require the file system name
        ImperativeExpect.toNotBeNullOrUndefined(fileSystemName, ZosFilesMessages.missingFileSystemName.message);

        // Removes undefined properties
        const tempOptions = !isNullOrUndefined(options) ? JSON.parse(JSON.stringify(options)) : {};
        tempOptions.action = "mount";

        ImperativeExpect.toNotBeNullOrUndefined(options["fs-type"],
            ZosFilesMessages.missingFsOption.message + "fs-type"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.mode,
            ZosFilesMessages.missingFsOption.message + "mode"
        );

        const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_MFS + "/" + fileSystemName;

        const jsonContent = JSON.stringify(tempOptions);
        const headers = [{"Content-Length": jsonContent.length}];

        const data = await ZosmfRestClient.putExpectString(session, endpoint, headers, jsonContent);

        return {
            success: true,
            commandResponse: ZosFilesMessages.fsMountedSuccessfully.message,
            apiResponse: data
        };
    }
}
