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

import { AbstractSession, IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import { IZosFilesResponse, IMountFsOptions, Mount } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to mount a Unix file system
 */
export default class FsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // collect the options from our command line arguments into an object
        const mountFsOptions: Partial<IMountFsOptions> = {
            "fs-type": commandParameters.arguments.fsType,
            "mode": commandParameters.arguments.mode,
            responseTimeout: commandParameters.arguments.responseTimeout
        };

        return Mount.fs(session, commandParameters.arguments.fileSystemName, commandParameters.arguments.mountPoint, mountFsOptions);
    }
}
