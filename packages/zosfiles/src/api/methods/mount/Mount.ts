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

import { AbstractSession, Headers, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";

import { IMountZfsOptions } from "./doc/IMountZfsOptions";
import { isNullOrUndefined } from "util";
import { IHeaderContent, ZosmfRestClient } from "../../../../../rest";
import { getErrorContext } from "../../../../../utils";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";

/**
 * This class holds helper functions that are used to execute AMS control statements through the z/OS MF APIs
 */
export class Mount {
    /**
     * Send the AMS request to z/OS MF
     *
     * @param {AbstractSession}   session           - z/OS MF connection info
     * @param {string | string[]} controlStatements - contains the statements or the file path to them
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the outcome of the API
     *
     * @throws {ImperativeError} controlStatements must be set
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_PUTIDCAMSAccessMethodsServices.htm
     */
    public static async zfs(
        session: AbstractSession,
        fileSystemName: string,
        options?: Partial<IMountZfsOptions>)
        : Promise<IZosFilesResponse> {
        // We require the file system name
        ImperativeExpect.toNotBeNullOrUndefined(fileSystemName, ZosFilesMessages.missingFileSystemName.message);

        // Removes undefined properties
        const tempOptions = !isNullOrUndefined(options) ? JSON.parse(JSON.stringify(options)) : {};
        tempOptions.action = "mount";

        ImperativeExpect.toNotBeNullOrUndefined(options["fs-type"],
            ZosFilesMessages.missingZfsOption.message + "fs-type"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options["fs-type"],
            ZosFilesMessages.missingZfsOption.message + "fs-type"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.mode,
            ZosFilesMessages.missingZfsOption.message + "mode"
        );

        const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_MFS + "/" + fileSystemName;

        const jsonContent = JSON.stringify(tempOptions);
        const headers = [{"Content-Length": jsonContent.length}];

        const data = await ZosmfRestClient.putExpectString(session, endpoint, headers, jsonContent);

        return {
            success: true,
            commandResponse: ZosFilesMessages.zfsMountedSuccessfully.message,
            apiResponse: data
        };
    }
}
