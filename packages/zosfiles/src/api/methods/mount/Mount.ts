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

import { AbstractSession, ImperativeExpect, ImperativeError } from "@zowe/imperative";

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
     * @param {string}           mountPoint      - contains the mount point
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
        mountPoint: string,
        options?: Partial<IMountFsOptions>)
        : Promise<IZosFilesResponse> {
        // We require the file system name and mount point
        ImperativeExpect.toBeDefinedAndNonBlank(fileSystemName, ZosFilesMessages.missingFileSystemName.message);
        ImperativeExpect.toBeDefinedAndNonBlank(mountPoint, ZosFilesMessages.missingMountPoint.message);

        // Removes undefined properties
        const tempOptions = !isNullOrUndefined(options) ? JSON.parse(JSON.stringify(options)) : {};

        this.fsValidateOptions(tempOptions);
        tempOptions.action = "mount";
        tempOptions["mount-point"] = mountPoint;

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

    /**
     * Validate the options for the command to mount a z/OS file system
     * @param options - options for the mounting of the file system
     */
    private static fsValidateOptions(options: IMountFsOptions): void {
        ImperativeExpect.toNotBeNullOrUndefined(options,
            ZosFilesMessages.missingFilesMountOptions.message
        );

        /* If our caller does not supply these options, we supply default values for them,
         * so they should exist at this point.
         */
        ImperativeExpect.toBeDefinedAndNonBlank(options["fs-type"],
            ZosFilesMessages.missingFsOption.message + "fs-type"
        );
        ImperativeExpect.toBeDefinedAndNonBlank(options.mode,
            ZosFilesMessages.missingFsOption.message + "mode"
        );

        // validate specific options
        for (const option in options) {
            if (options.hasOwnProperty(option)) {
                switch (option) {

                    case "mode":
                        if ((options.mode !== "rdonly") && (options.mode !== "rdwr")) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.invalidMountModeOption.message + options.mode
                            });
                        }
                        break;

                    case "fs-type":
                        // no validation at this time
                        break;

                    default:
                        throw new ImperativeError({msg: ZosFilesMessages.invalidFilesMountOption.message + option});

                } // end switch
            }
        } // end for
    }
}
